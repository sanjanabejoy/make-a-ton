import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Save, Building2, Mail, Phone, MapPin } from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import { Skeleton } from '../../../components/ui/Skeleton';

export function PortalProfilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingAddress: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['portalProfile'],
    queryFn: async () => {
      const res = await http.get('/portal/profile');
      const p = res.data || res;
      setFormData(p);
      return p;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.put('/portal/profile', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalProfile'] });
      toast.success('Profile details updated successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Company & Billing Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Keep your organization's legal name and billing destination up to date.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Contact / Representative Name" required>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Email Address">
            <Input
              type="email"
              value={formData.email || ''}
              disabled
              helper="Primary billing email associated with login"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <FormField label="Registered Billing Address">
            <Textarea
              value={formData.billingAddress || ''}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              rows={3}
            />
          </FormField>

          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              isLoading={updateMutation.isPending}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default PortalProfilePage;
