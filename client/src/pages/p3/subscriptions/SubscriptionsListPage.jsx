import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Layers, Search, Filter } from 'lucide-react';
import http from '../../../api/http';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Tabs from '../../../components/ui/Tabs';
import FilterBar from '../../../components/ui/FilterBar';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import StatusBadge from '../../../components/ui/StatusBadge';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';

export function SubscriptionsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('status') || 'all';
  const planFilter = searchParams.get('planId') || '';
  const search = searchParams.get('q') || '';

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await http.get('/plans');
      return res.data || res;
    },
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptions', { status: currentTab, planId: planFilter, q: search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentTab !== 'all') params.set('status', currentTab);
      if (planFilter) params.set('planId', planFilter);
      if (search) params.set('q', search);
      const res = await http.get(`/subscriptions?${params.toString()}`);
      return res.data || res;
    },
  });

  const plans = Array.isArray(plansData) ? plansData : plansData?.data || [];
  const subscriptions = Array.isArray(data) ? data : data?.data || [];

  const handleTabChange = (tabId) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'all') next.delete('status');
    else next.set('status', tabId);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchChange = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('q', val);
    else next.delete('q');
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePlanChange = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('planId', val);
    else next.delete('planId');
    next.set('page', '1');
    setSearchParams(next);
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'quotation', label: 'Quotation' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'active', label: 'Active' },
    { id: 'needs_renewal', label: 'Needs Renewal' },
    { id: 'closed', label: 'Closed' },
  ];

  const columns = [
    {
      header: 'Subscription #',
      accessor: 'number',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-sm text-indigo-600 hover:text-indigo-800">
          {row.number}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.customerName}</span>
          <p className="text-xs text-slate-400">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: 'planName',
      sortable: true,
      cell: (row) => <span className="font-medium text-slate-800 text-sm">{row.planName}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <StatusBadge
          status={row.status}
          pausedAt={row.pausedAt}
        />
      ),
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
      sortable: true,
      cell: (row) => <DateText date={row.startDate} className="text-xs text-slate-600" />,
    },
    {
      header: 'Expiry Date',
      accessor: 'expiryDate',
      sortable: true,
      cell: (row) => <DateText date={row.expiryDate} className="text-xs text-slate-600" />,
    },
    {
      header: 'Next Billing',
      accessor: 'nextBillingDate',
      cell: (row) =>
        row.nextBillingDate ? (
          <DateText date={row.nextBillingDate} className="text-xs font-medium text-slate-800" />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      header: 'Recurring Total',
      accessor: 'recurringAmount',
      align: 'right',
      cell: (row) => (
        <div className="font-mono font-bold text-slate-900 text-sm">
          <Money amount={row.recurringAmount || 0} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subscriptions"
        description="Monitor end-to-end subscription lifecycle: quotations, recurring cycles, and renewals"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/subscriptions/new')}
            icon={Plus}
          >
            New Subscription
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={currentTab} onChange={handleTabChange} />

      <FilterBar>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by SUB-# or customer..."
          />
          <Select
            value={planFilter}
            onChange={(e) => handlePlanChange(e.target.value)}
            className="w-full sm:w-48 text-xs py-2"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={subscriptions}
        total={subscriptions.length}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onRowClick={(row) => navigate(`/subscriptions/${row.id}`)}
        emptyTitle="No subscriptions match this view"
        emptyDescription="Create a quotation or subscription to get started."
        emptyActionLabel="New Subscription"
        onEmptyAction={() => navigate('/subscriptions/new')}
      />
    </div>
  );
}

export default SubscriptionsListPage;
