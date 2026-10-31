import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Layers,
  FileText,
  CreditCard,
  History,
  Edit2,
  Plus,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import StatusBadge from '../../../components/ui/StatusBadge';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Drawer from '../../../components/ui/Drawer';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import { Skeleton } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch Customer
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await http.get(`/customers/${id}`);
      const c = res.data || res;
      setFormData(c);
      return c;
    },
  });

  // Fetch Subscriptions for this customer
  const { data: subsData } = useQuery({
    queryKey: ['subscriptions', { customerId: id }],
    queryFn: async () => {
      const res = await http.get(`/subscriptions?customerId=${id}`);
      return res.data || res;
    },
    enabled: activeTab === 'subscriptions' || activeTab === 'overview',
  });

  // Fetch Invoices for this customer
  const { data: invData } = useQuery({
    queryKey: ['invoices', { customerId: id }],
    queryFn: async () => {
      const res = await http.get(`/invoices?customerId=${id}`);
      return res.data || res;
    },
    enabled: activeTab === 'invoices' || activeTab === 'overview',
  });

  // Fetch Timeline events for this customer
  const { data: timelineData } = useQuery({
    queryKey: ['customerTimeline', id],
    queryFn: async () => {
      const res = await http.get(`/customers/${id}/timeline`);
      return res.data || res;
    },
    enabled: activeTab === 'timeline',
  });

  const subsList = Array.isArray(subsData) ? subsData : subsData?.data || [];
  const invList = Array.isArray(invData) ? invData : invData?.data || [];
  const timelineList = Array.isArray(timelineData) ? timelineData : timelineData?.data || [];

  const updateCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.put(`/customers/${id}`, payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Customer details updated');
      setEditDrawerOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update customer');
    },
  });

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateCustomerMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Customer not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscriptions', label: 'Subscriptions', count: subsList.length },
    { id: 'invoices', label: 'Invoices', count: invList.length },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all customers
        </button>
        <PageHeader
          title={customer.name}
          description={`Customer ID: #${customer.id}${customer.legacyId ? ` (Legacy: ${customer.legacyId})` : ''}`}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={Edit2}
                onClick={() => setEditDrawerOpen(true)}
              >
                Edit Details
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => navigate(`/subscriptions/new?customerId=${customer.id}`)}
              >
                New Subscription
              </Button>
            </div>
          }
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {customer.stats?.activeSubscriptions ?? subsList.filter((s) => s.status === 'active').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Overdue Invoices
                  </p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {customer.stats?.overdueInvoices ?? invList.filter((i) => i.isOverdue).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Revenue Billed
                  </p>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    <Money amount={customer.stats?.totalRevenue || 23523.3} />
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">
                Contact & Profile Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block">Email Address</span>
                    <span className="font-medium">{customer.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block">Phone Number</span>
                    <span className="font-medium">{customer.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block">Company Name</span>
                    <span className="font-medium">{customer.company || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block">Billing Address</span>
                    <span className="font-medium">{customer.billingAddress || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">
                Account Status
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Customer Portal Access</span>
                  <div className="mt-1">
                    <Badge variant={customer.hasLogin ? 'green' : 'slate'} dot>
                      {customer.hasLogin ? 'Enabled & Active' : 'No Web Login'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Customer Since</span>
                  <DateText date={customer.createdAt} className="font-medium text-slate-800" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {subsList.length === 0 ? (
              <EmptyState
                title="No subscriptions found"
                description="This customer does not have any active or past subscriptions."
                actionLabel="Create Subscription"
                onAction={() => navigate(`/subscriptions/new?customerId=${customer.id}`)}
              />
            ) : (
              subsList.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/subscriptions/${sub.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-indigo-600">{sub.number}</span>
                      <StatusBadge status={sub.status} pausedAt={sub.pausedAt} />
                      <span className="font-medium text-sm text-slate-800">{sub.planName}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Term: <DateText date={sub.startDate} /> to <DateText date={sub.expiryDate} /> · Next billing: <DateText date={sub.nextBillingDate} />
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      <Money amount={sub.recurringAmount || 0} />
                    </div>
                    <span className="text-[11px] text-slate-400">per cycle</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === 'invoices' && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {invList.length === 0 ? (
              <EmptyState
                title="No invoices found"
                description="Invoices will appear here as billing cycles are triggered."
              />
            ) : (
              invList.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900">{inv.number}</span>
                      <StatusBadge
                        status={inv.status}
                        isOverdue={inv.isOverdue}
                        daysOverdue={inv.daysOverdue}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Due: <DateText date={inv.dueDate} /> · Period: <DateText date={inv.periodStart} /> to <DateText date={inv.periodEnd} />
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      <Money amount={inv.total} />
                    </div>
                    <span className="text-xs text-slate-500">
                      Paid: <Money amount={inv.amountPaid || 0} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Timeline */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          {timelineList.length === 0 ? (
            <EmptyState
              icon={History}
              title="No events logged yet"
              description="Customer activity, quotation conversions, and billing runs will record events here."
            />
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineList.map((ev, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 ring-2 ring-indigo-50 shadow-xs" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900">{ev.message}</p>
                    <div className="flex items-center gap-2">
                      {ev.simDate && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Simulated: {ev.simDate}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        <DateText date={ev.occurredAt} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Edit Drawer */}
      <Drawer
        isOpen={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title="Edit Customer Profile"
        description="Update corporate billing contact information"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="outline" onClick={() => setEditDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateSubmit}
              isLoading={updateCustomerMutation.isPending}
            >
              Save Profile
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Email Address" required>
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </FormField>

          <FormField label="Phone Number">
            <Input
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormField>

          <FormField label="Company Name">
            <Input
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </FormField>

          <FormField label="Billing Address">
            <Textarea
              value={formData.billingAddress || ''}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              rows={3}
            />
          </FormField>
        </form>
      </Drawer>
    </div>
  );
}

export default CustomerDetailPage;
