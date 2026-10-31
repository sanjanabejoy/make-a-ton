import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Phone, Building2, User, ChevronRight } from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Drawer from '../../../components/ui/Drawer';
import FilterBar from '../../../components/ui/FilterBar';
import SearchInput from '../../../components/ui/SearchInput';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Badge from '../../../components/ui/Badge';
import DateText from '../../../components/ui/DateText';

export function CustomersListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingAddress: '',
  });
  const [errors, setErrors] = useState({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await http.get(`/customers?q=${encodeURIComponent(search)}`);
      return res.data || res;
    },
  });

  const customersList = Array.isArray(data) ? data : data?.data || [];

  const createCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.post('/customers', payload);
    },
    onSuccess: (newCust) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer registered successfully');
      setCreateDrawerOpen(false);
      setFormData({ name: '', email: '', phone: '', company: '', billingAddress: '' });
      if (newCust?.id) {
        navigate(`/customers/${newCust.id}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create customer');
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    createCustomerMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          {row.company && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              {row.company}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: 'email',
      cell: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <p className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {row.email}
          </p>
          {row.phone && (
            <p className="flex items-center gap-1.5 text-slate-500">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {row.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Portal Access',
      accessor: 'hasLogin',
      cell: (row) => (
        <Badge variant={row.hasLogin ? 'indigo' : 'slate'} size="sm">
          {row.hasLogin ? 'Portal Active' : 'No Account'}
        </Badge>
      ),
    },
    {
      header: 'Created On',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => <DateText date={row.createdAt} className="text-xs text-slate-500" />,
    },
    {
      header: '',
      accessor: 'actions',
      align: 'right',
      cell: () => <ChevronRight className="h-4 w-4 text-slate-400" />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="View corporate accounts, manage billing contacts, and inspect customer portfolios"
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateDrawerOpen(true)}
            icon={Plus}
          >
            Add Customer
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, company, or email..."
        />
        <div className="text-xs text-slate-500 font-medium">
          {customersList.length} customers
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={customersList}
        total={customersList.length}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyTitle="No customers found"
        emptyDescription="Try refining your search keyword or create a new customer record."
        emptyActionLabel="Add Customer"
        onEmptyAction={() => setCreateDrawerOpen(true)}
      />

      {/* New Customer Drawer */}
      <Drawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Add New Customer"
        description="Register a business record for quotations, invoicing, and subscriptions."
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="outline" onClick={() => setCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={createCustomerMutation.isPending}
            >
              Create Customer
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormField label="Full Name / Primary Contact" required error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Technologies Pvt Ltd"
            />
          </FormField>

          <FormField label="Email Address" required error={errors.email}>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="billing@acme.com"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone Number">
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </FormField>

            <FormField label="Company Name">
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Group"
              />
            </FormField>
          </div>

          <FormField label="Billing Address">
            <Textarea
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="Building, Street, City, State, PIN"
              rows={3}
            />
          </FormField>
        </form>
      </Drawer>
    </div>
  );
}

export default CustomersListPage;
