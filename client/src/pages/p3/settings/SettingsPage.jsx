import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Building, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Checkbox from '../../../components/ui/Checkbox';
import FormField from '../../../components/ui/FormField';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { Skeleton } from '../../../components/ui/Skeleton';

export function SettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    currency: 'INR',
    reminder_offsets: [-3, 0, 3, 7, 14],
    auto_confirm_invoices: false,
    auto_send_reminders: false,
    company: {
      name: '',
      address: '',
      gstin: '',
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await http.get('/settings');
      const s = res.data || res;
      setFormData(s);
      return s;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('App settings saved successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save settings');
    },
  });

  const demoResetMutation = useMutation({
    mutationFn: async () => {
      return await http.post('/admin/demo/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Demo environment reset successfully');
      setResetModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to reset demo data');
    },
  });

  const handleOffsetsChange = (str) => {
    const arr = str
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));
    setFormData({ ...formData, reminder_offsets: arr });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Application Settings"
        description="Configure organization profile, automated billing toggles, and collections offsets"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile */}
        <Card>
          <CardHeader
            title="Company Information"
            description="Used on generated invoices, quotation headers, and customer receipts"
          />
          <div className="space-y-4">
            <FormField label="Company Legal Name" required>
              <Input
                value={formData.company?.name || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, name: e.target.value },
                  })
                }
                placeholder="Brightloop Software Pvt Ltd"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="GSTIN / Tax ID">
                <Input
                  value={formData.company?.gstin || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, gstin: e.target.value },
                    })
                  }
                  placeholder="29ABCDE1234F1Z5"
                />
              </FormField>

              <FormField label="Billing Currency">
                <Input
                  value={formData.currency || 'INR'}
                  disabled
                  helper="Default platform currency (INR ₹)"
                />
              </FormField>
            </div>

            <FormField label="Registered Billing Address">
              <Textarea
                value={formData.company?.address || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, address: e.target.value },
                  })
                }
                rows={2}
                placeholder="Indiranagar 100ft Road, Bangalore, Karnataka 560038"
              />
            </FormField>
          </div>
        </Card>

        {/* Automation & Policies */}
        <Card>
          <CardHeader
            title="Automation & Billing Policies"
            description="Control how the recurring engine and collections queue operate"
          />
          <div className="space-y-4">
            <Checkbox
              label="Auto-confirm Invoices"
              checked={!!formData.auto_confirm_invoices}
              onChange={(e) =>
                setFormData({ ...formData, auto_confirm_invoices: e.target.checked })
              }
              helper="When enabled, recurring billing runs immediately set generated invoices to 'confirmed' status instead of 'draft'."
            />

            <Checkbox
              label="Auto-send Payment Reminders"
              checked={!!formData.auto_send_reminders}
              onChange={(e) =>
                setFormData({ ...formData, auto_send_reminders: e.target.checked })
              }
              helper="Automatically deliver due date reminders to customers when queued."
            />

            <FormField
              label="Collection Reminder Schedule Offsets (Days relative to due date)"
              helper="Comma-separated offsets. E.g. -3 (upcoming), 0 (due today), 3 (friendly), 7 (second), 14 (final)"
            >
              <Input
                value={(formData.reminder_offsets || []).join(', ')}
                onChange={(e) => handleOffsetsChange(e.target.value)}
                placeholder="-3, 0, 3, 7, 14"
              />
            </FormField>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            isLoading={updateMutation.isPending}
          >
            Save Settings
          </Button>
        </div>
      </form>

      {/* Demo Controls Card */}
      <Card className="border-rose-200 bg-rose-50/20">
        <CardHeader
          title="Demo Controls"
          description="Reset database state and re-seed clean demonstration catalog & subscriptions"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Resets all mock records, resets simulated clock to real date, and reloads standard demo seed.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            icon={RotateCcw}
          >
            Reset Demo Data
          </Button>
        </div>
      </Card>

      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={() => demoResetMutation.mutate()}
        title="Reset Demo Environment?"
        message="This will reset all modified products, plans, customers, and subscriptions back to initial demo seeds."
        confirmText="Reset Everything"
        variant="danger"
        isLoading={demoResetMutation.isPending}
      />
    </div>
  );
}

export default SettingsPage;
