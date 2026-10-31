-- Run this in Supabase SQL Editor (admin-only reporting data, computed in the database)
create or replace function reports_data() returns json language plpgsql security definer set search_path=public as $$
begin
  if my_role()<>'admin' then raise exception 'Admin only'; end if;
  return json_build_object(
    'collected',(select coalesce(json_agg(r order by r.m),'[]'::json) from (select to_char(date_trunc('month',paid_on),'YYYY-MM') m, sum(amount) v from payments group by 1) r),
    'invoiced',(select coalesce(json_agg(r order by r.m),'[]'::json) from (select to_char(date_trunc('month',period_start),'YYYY-MM') m, sum(total) v from invoices group by 1) r),
    'growth',(select coalesce(json_agg(r order by r.m),'[]'::json) from (select to_char(date_trunc('month',start_date),'YYYY-MM') m, count(*) v from subscriptions group by 1) r),
    'by_status',(select coalesce(json_agg(r),'[]'::json) from (select status n, count(*) v from subscriptions group by status) r),
    'by_plan',(select coalesce(json_agg(r),'[]'::json) from (
        select p.name n, sum((p.price+coalesce(v.extra,0))*s.qty*case p.cycle when 'daily' then 30 when 'weekly' then 4.33 when 'monthly' then 1 else 1/12.0 end) v
        from subscriptions s join plans p on p.id=s.plan_id left join variants v on v.id=s.variant_id where s.status='Active' group by p.name) r),
    'money',(select json_agg(r) from (
        select 'Paid' n, coalesce(sum(total),0) v from invoices where status='Paid'
        union all select 'Outstanding', coalesce(sum(total-paid),0) from invoices where status='Confirmed' and due_date>=current_date
        union all select 'Overdue', coalesce(sum(total-paid),0) from invoices where status='Confirmed' and due_date<current_date) r)
  );
end $$;
