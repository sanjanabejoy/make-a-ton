-- Paste this whole file into Supabase > SQL Editor > Run.
-- The FIRST account that signs up becomes admin. Everyone after is a customer.

create table profiles(id uuid primary key references auth.users on delete cascade, email text unique not null, full_name text,
  role text not null default 'customer' check(role in('admin','staff','customer')));
create function my_role() returns text language sql security definer stable set search_path=public as $$ select role from profiles where id=auth.uid() $$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,email,full_name,role) values(new.id,new.email,new.raw_user_meta_data->>'full_name',
  case when (select count(*) from profiles)=0 then 'admin' else 'customer' end); return new; end $$;
create trigger on_auth_user after insert on auth.users for each row execute function handle_new_user();

create table products(id bigserial primary key,name text not null,type text,sales_price numeric not null default 0,cost_price numeric not null default 0,notes text);
create table variants(id bigserial primary key,product_id bigint references products on delete cascade,name text not null,extra numeric not null default 0);
create table plans(id bigserial primary key,product_id bigint references products on delete cascade,name text not null,price numeric not null,
  cycle text not null check(cycle in('daily','weekly','monthly','yearly')),min_qty int not null default 1,available_from date,available_to date,auto_close boolean not null default false);
create table discounts(id bigserial primary key,code text unique not null,kind text not null check(kind in('percent','fixed')),value numeric not null,
  min_amount numeric not null default 0,min_qty int not null default 1,starts_on date,ends_on date,max_uses int,used int not null default 0,product_id bigint references products);
create table quote_templates(id bigserial primary key,name text not null,plan_id bigint references plans on delete cascade,qty int not null default 1,valid_days int not null default 15);

create sequence sub_seq; create sequence inv_seq;
create table subscriptions(id bigserial primary key,number text unique default 'SUB-'||lpad(nextval('sub_seq')::text,4,'0'),
  customer_id uuid not null references profiles,plan_id bigint not null references plans,variant_id bigint references variants,qty int not null check(qty>0),
  start_date date not null,expiry_date date not null,next_billing date not null,terms text default 'Net 15',discount_id bigint references discounts,
  status text not null default 'Draft' check(status in('Draft','Quotation','Confirmed','Active','Closed')));
create table invoices(id bigserial primary key,number text unique default 'INV-'||lpad(nextval('inv_seq')::text,5,'0'),
  subscription_id bigint not null references subscriptions,customer_id uuid not null references profiles,period_start date not null,
  subtotal numeric not null,discount numeric not null default 0,tax numeric not null,total numeric not null,paid numeric not null default 0,
  status text not null default 'Confirmed' check(status in('Draft','Confirmed','Paid')),due_date date not null,created_at timestamptz default now(),
  unique(subscription_id,period_start));  -- idempotency: one invoice per subscription per period
create table payments(id bigserial primary key,invoice_id bigint not null references invoices,method text not null,amount numeric not null check(amount>0),paid_on date not null default current_date,note text);
create index on invoices(status,due_date); create index on invoices(customer_id); create index on subscriptions(status,next_billing); create index on subscriptions(customer_id);

-- valid status transitions only
create function check_status() returns trigger language plpgsql as $$ begin
  if new.status<>old.status and not ((old.status,new.status) in (('Draft','Quotation'),('Quotation','Confirmed'),('Confirmed','Active'),('Active','Closed')))
  then raise exception 'Invalid transition % to %',old.status,new.status; end if; return new; end $$;
create trigger sub_status before update on subscriptions for each row execute function check_status();

-- billing run: idempotent, applies discounts + 18 percent GST on the server
create function generate_due_invoices() returns int language plpgsql security definer set search_path=public as $$
declare s record; d record; n int:=0; nb date; sub numeric; disc numeric; tx numeric; ins int; step interval;
begin
  if my_role() not in('admin','staff') then raise exception 'Not allowed'; end if;
  update subscriptions set status='Closed' where status='Active' and plan_id in (select id from plans where auto_close and available_to<current_date);
  for s in select su.*,p.price,p.cycle,p.product_id,coalesce(v.extra,0) extra from subscriptions su join plans p on p.id=su.plan_id
           left join variants v on v.id=su.variant_id where su.status='Active' and su.next_billing<=current_date loop
    step:=case s.cycle when 'daily' then interval '1 day' when 'weekly' then interval '7 days' when 'monthly' then interval '1 month' else interval '1 year' end;
    nb:=s.next_billing;
    while nb<=current_date and nb<=s.expiry_date loop
      sub:=(s.price+s.extra)*s.qty; disc:=0;
      if s.discount_id is not null then
        select * into d from discounts where id=s.discount_id and (starts_on is null or starts_on<=current_date) and (ends_on is null or ends_on>=current_date)
          and (max_uses is null or used<max_uses) and s.qty>=min_qty and sub>=min_amount and (product_id is null or product_id=s.product_id);
        if found then disc:=case when d.kind='percent' then round(sub*d.value/100,2) else least(d.value,sub) end; end if;
      end if;
      tx:=round((sub-disc)*0.18,2);
      insert into invoices(subscription_id,customer_id,period_start,subtotal,discount,tax,total,due_date)
        values(s.id,s.customer_id,nb,sub,disc,tx,sub-disc+tx,nb+15) on conflict(subscription_id,period_start) do nothing;
      get diagnostics ins=row_count;
      if ins=1 then n:=n+1; if disc>0 then update discounts set used=used+1 where id=d.id; end if; end if;
      nb:=(nb+step)::date;
    end loop;
    update subscriptions set next_billing=nb where id=s.id;
  end loop;
  return n;
end $$;

create function record_payment(inv bigint,m text,amt numeric,nt text) returns void language plpgsql security definer set search_path=public as $$
declare i invoices;
begin
  if my_role() not in('admin','staff') then raise exception 'Not allowed'; end if;
  select * into i from invoices where id=inv for update;
  if amt<=0 or amt>i.total-i.paid then raise exception 'Invalid amount'; end if;
  insert into payments(invoice_id,method,amount,note) values(inv,m,amt,nt);
  update invoices set paid=paid+amt,status=case when paid+amt>=total then 'Paid' else status end where id=inv;
end $$;

create function dashboard_stats() returns json language plpgsql security definer set search_path=public as $$
begin
  if my_role() not in('admin','staff') then raise exception 'Not allowed'; end if;
  return json_build_object(
   'active',(select count(*) from subscriptions where status='Active'),
   'mrr',(select coalesce(sum((p.price+coalesce(v.extra,0))*s.qty*case p.cycle when 'daily' then 30 when 'weekly' then 4.33 when 'monthly' then 1 else 1/12.0 end),0)
          from subscriptions s join plans p on p.id=s.plan_id left join variants v on v.id=s.variant_id where s.status='Active'),
   'collected',(select coalesce(sum(amount),0) from payments),
   'outstanding',(select coalesce(sum(total-paid),0) from invoices where status<>'Paid'),
   'overdue',(select count(*) from invoices where status='Confirmed' and due_date<current_date));
end $$;

create function make_staff(em text) returns void language plpgsql security definer set search_path=public as $$
begin
  if my_role()<>'admin' then raise exception 'Only admin can add staff'; end if;
  update profiles set role='staff' where email=em and role='customer';
  if not found then raise exception 'No customer account with that email. Ask them to sign up first.'; end if;
end $$;

-- row level security
alter table profiles enable row level security; alter table products enable row level security; alter table variants enable row level security;
alter table plans enable row level security; alter table discounts enable row level security; alter table quote_templates enable row level security;
alter table subscriptions enable row level security; alter table invoices enable row level security; alter table payments enable row level security;
create policy p_prof on profiles for select to authenticated using(id=auth.uid() or my_role() in('admin','staff'));
do $$ declare t text; begin foreach t in array array['products','variants','plans','quote_templates'] loop
  execute format('create policy r_%s on %I for select to authenticated using(true)',t,t);
  execute format('create policy w_%s on %I for all to authenticated using(my_role()=''admin'') with check(my_role()=''admin'')',t,t);
end loop; end $$;
create policy d_all on discounts for all to authenticated using(my_role()='admin') with check(my_role()='admin');
create policy d_read on discounts for select to authenticated using(my_role() in('admin','staff'));
create policy s_read on subscriptions for select to authenticated using(customer_id=auth.uid() or my_role() in('admin','staff'));
create policy s_write on subscriptions for all to authenticated using(my_role() in('admin','staff')) with check(my_role() in('admin','staff'));
create policy i_read on invoices for select to authenticated using(customer_id=auth.uid() or my_role() in('admin','staff'));
create policy y_read on payments for select to authenticated using(my_role() in('admin','staff') or exists(select 1 from invoices i where i.id=invoice_id and i.customer_id=auth.uid()));

-- demo seed data
insert into products(name,type,sales_price,cost_price,notes) values('Brightloop CRM','Software',999,300,'Flagship CRM');
insert into variants(product_id,name,extra) values(1,'Standard',0),(1,'Odoo',560);
insert into plans(product_id,name,price,cycle,min_qty,available_from,available_to) values(1,'CRM Monthly',999,'monthly',5,current_date,current_date+365);
insert into quote_templates(name,plan_id,qty,valid_days) values('Enterprise CRM pack',1,25,15);
insert into discounts(code,kind,value,min_qty,starts_on,ends_on,max_uses) values('SEATS10','percent',10,10,current_date,current_date+90,50);
