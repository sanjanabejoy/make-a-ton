import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, Shield, Lock, Check, X, Mail } from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import DateText from '../../../components/ui/DateText';
import { cn } from '../../../lib/utils';

export function StaffPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Password rules
  const checks = [
    { label: 'Minimum 9 characters (length > 8)', passed: password.length >= 9 },
    { label: 'At least 1 uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
    { label: 'At least 1 lowercase letter (a-z)', passed: /[a-z]/.test(password) },
    { label: 'At least 1 special character (!@#$%^&*)', passed: /[^A-Za-z0-9]/.test(password) },
  ];
  const allPassed = checks.every((c) => c.passed);

  const { data: staffData, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await http.get('/staff');
      return res.data || res;
    },
  });

  const staffList = Array.isArray(staffData) ? staffData : staffData?.data || [];

  const createStaffMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.post('/staff', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff account created successfully');
      setCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setError('');
    },
    onError: (err) => {
      setError(err.message || 'Failed to create staff account');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id) => {
      return await http.patch(`/staff/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('User status toggled');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update user status');
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!allPassed) {
      setError('Please satisfy all password complexity rules');
      return;
    }
    setError('');
    createStaffMutation.mutate({ name, email, password });
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
            {row.name?.[0] || 'S'}
          </div>
          <div>
            <span className="font-semibold text-slate-900">{row.name}</span>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.role === 'admin' ? 'purple' : 'blue'}>
          {row.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <Badge variant={row.isActive ? 'green' : 'slate'} dot>
          {row.isActive ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      header: 'Created On',
      accessor: 'createdAt',
      cell: (row) => <DateText date={row.createdAt} className="text-xs text-slate-500" />,
    },
    {
      header: 'Action',
      accessor: 'id',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleStatusMutation.mutate(row.id)}
          disabled={row.role === 'admin'}
        >
          {row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff Accounts"
        description="Administered staff accounts with operational access to subscriptions and invoicing"
        actions={
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            icon={Plus}
          >
            Create Staff
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={staffList}
        total={staffList.length}
        isLoading={isLoading}
        error={fetchError}
        onRetry={refetch}
      />

      {/* Create Staff Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Staff Account"
        description="Provision a new staff user with day-to-day operational permissions."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <FormField label="Full Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </FormField>

          <FormField label="Work Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@brightloop.test"
              required
            />
          </FormField>

          <FormField label="Temporary Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 9 characters with upper, lower, special"
              required
            />

            {/* Password checklist */}
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Password Requirements
              </p>
              {checks.map((check, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-colors',
                      check.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                    )}
                  >
                    {check.passed ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <X className="h-2.5 w-2.5" />}
                  </span>
                  <span className={cn(check.passed ? 'text-slate-800 font-medium' : 'text-slate-500')}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </FormField>

          <div className="flex justify-end gap-2.5 pt-4 border-t">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!allPassed || !name.trim() || !email.trim()}
              isLoading={createStaffMutation.isPending}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StaffPage;
