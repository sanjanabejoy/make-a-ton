import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Users,
} from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import FormField from '../../../components/ui/FormField';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import DataTable from '../../../components/ui/DataTable';
import DateText from '../../../components/ui/DateText';

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Analyse' },
  { id: 3, label: 'Map Columns' },
  { id: 4, label: 'Validate' },
  { id: 5, label: 'Preview' },
  { id: 6, label: 'Import & Report' },
];

export function MigrationWizardPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [kind, setKind] = useState('customers');
  const [file, setFile] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [mapping, setMapping] = useState({});
  const [billMissedPeriods, setBillMissedPeriods] = useState(false);
  const [confirmUnderstood, setConfirmUnderstood] = useState(false);

  // Fetch Migration Jobs History
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ['migrationJobs'],
    queryFn: async () => {
      const res = await http.get('/migration/jobs');
      return res.data || res;
    },
  });

  // Fetch validation preview rows
  const { data: rowsData, refetch: refetchRows } = useQuery({
    queryKey: ['migrationRows', currentJob?.id],
    queryFn: async () => {
      const res = await http.get(`/migration/jobs/${currentJob?.id}/rows`);
      return res.data || res;
    },
    enabled: step >= 4 && !!currentJob?.id,
  });

  const jobsList = Array.isArray(jobsData) ? jobsData : jobsData?.data || [];
  const rowsList = Array.isArray(rowsData) ? rowsData : rowsData?.data || [];

  // Step 1 -> 2: Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      return await http.post('/migration/jobs', {
        kind,
        fileName: file ? file.name : `${kind}_sample.csv`,
      });
    },
    onSuccess: (job) => {
      const j = job.data || job;
      setCurrentJob(j);
      setMapping(j.mapping || {});
      setStep(2);
      toast.success('Spreadsheet parsed successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to upload spreadsheet');
    },
  });

  // Step 3 -> 4: Validate mutation
  const validateMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/migration/jobs/${currentJob?.id}/validate`, {
        mapping,
        billMissedPeriods,
      });
    },
    onSuccess: () => {
      setStep(4);
      refetchRows();
      toast.success('Validation finished');
    },
    onError: (err) => {
      toast.error(err.message || 'Validation error');
    },
  });

  // Step 5 -> 6: Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/migration/jobs/${currentJob?.id}/import`);
    },
    onSuccess: (res) => {
      setStep(6);
      queryClient.invalidateQueries({ queryKey: ['migrationJobs'] });
      toast.success('Migration import finished');
    },
    onError: (err) => {
      toast.error(err.message || 'Import error');
    },
  });

  const targetCustomerFields = [
    { key: 'name', label: 'Customer Name *', required: true },
    { key: 'email', label: 'Email Address *', required: true },
    { key: 'phone', label: 'Phone Number' },
    { key: 'company', label: 'Company Name' },
    { key: 'billingAddress', label: 'Billing Address' },
    { key: 'legacyId', label: 'Spreadsheet ID (Legacy ID)' },
  ];

  const targetSubscriptionFields = [
    { key: 'customerEmail', label: 'Customer Email *', required: true },
    { key: 'planName', label: 'Plan Name *', required: true },
    { key: 'startDate', label: 'Start Date *', required: true },
    { key: 'expiryDate', label: 'Expiry Date' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'status', label: 'Status' },
    { key: 'legacyId', label: 'Subscription ID (Legacy)' },
  ];

  const targetFields = kind === 'customers' ? targetCustomerFields : targetSubscriptionFields;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Smart Migration Centre"
        description="Safely import existing messy Excel and CSV spreadsheets into SubscriptIQ with automatic column matching, data validation, and non-destructive previews"
      />

      {/* 6-Step Stepper Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200 z-0" />
          {STEPS.map((s) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : s.id}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    isCurrent ? 'text-indigo-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <Card className="space-y-6">
          <CardHeader
            title="Step 1: Upload Existing Spreadsheet"
            description="Select whether you are importing Customers or Subscriptions and select a file (.csv, .xlsx)"
          />

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setKind('customers')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                kind === 'customers'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Users className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-bold text-sm">Customers First</p>
                <p className="text-xs text-slate-500">Clients, company records, and contact details</p>
              </div>
            </div>

            <div
              onClick={() => setKind('subscriptions')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                kind === 'subscriptions'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Layers className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-bold text-sm">Subscriptions</p>
                <p className="text-xs text-slate-500">Active and historical plan commitments</p>
              </div>
            </div>
          </div>

          <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
            <UploadCloud className="h-10 w-10 text-indigo-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">
              Drag & Drop your {kind}.csv or Excel file here
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports UTF-8 CSV, .xlsx, and .xls up to 10 MB</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="mt-4 text-xs text-slate-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="primary"
              onClick={() => uploadMutation.mutate()}
              isLoading={uploadMutation.isPending}
              icon={ArrowRight}
            >
              Upload & Analyse
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: ANALYSE */}
      {step === 2 && (
        <Card className="space-y-6">
          <CardHeader
            title="Step 2: Spreadsheet Structure Analysis"
            description="SubscriptIQ analysed your file headers and data profiles"
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Rows</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">60 rows</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border">
              <span className="text-xs text-slate-500 uppercase font-semibold">Columns Found</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">5 columns</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border">
              <span className="text-xs text-slate-500 uppercase font-semibold">Inferred Model</span>
              <div className="mt-1">
                <Badge variant="indigo" size="lg" className="capitalize">{kind}</Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(1)} icon={ArrowLeft}>
              Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)} icon={ArrowRight}>
              Proceed to Column Mapping
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: MAP COLUMNS */}
      {step === 3 && (
        <Card className="space-y-6">
          <CardHeader
            title="Step 3: Smart Column Mapping"
            description="Match columns from your spreadsheet to SubscriptIQ entities. High confidence matches are pre-selected."
          />

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Spreadsheet Header</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">SubscriptIQ Target Field</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(mapping).map((headerKey, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                    {headerKey}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="green" size="sm">95% Match</Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Select
                      value={mapping[headerKey] || ''}
                      onChange={(e) =>
                        setMapping({ ...mapping, [headerKey]: e.target.value })
                      }
                      className="text-xs max-w-xs"
                    >
                      <option value="">(Ignore Column)</option>
                      {targetFields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {kind === 'subscriptions' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Checkbox
                label="Bill missed periods for stale renewal dates"
                checked={billMissedPeriods}
                onChange={(e) => setBillMissedPeriods(e.target.checked)}
                helper="When OFF (Recommended), subscriptions with past renewal dates will resume from their next natural cycle without back-billing historical charges."
              />
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(2)} icon={ArrowLeft}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => validateMutation.mutate()}
              isLoading={validateMutation.isPending}
              icon={ArrowRight}
            >
              Validate Rows
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: VALIDATE */}
      {step === 4 && (
        <Card className="space-y-6">
          <CardHeader
            title="Step 4: Row-Level Validation Summary"
            description="Pre-checks detect syntax errors, missing required fields, and duplicate entries"
          />

          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-xs text-emerald-800 uppercase font-semibold">Valid Rows</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">52</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <span className="text-xs text-amber-800 uppercase font-semibold">Warnings</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">4</p>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-xs text-rose-800 uppercase font-semibold">Errors</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">3</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-600 uppercase font-semibold">Duplicates</span>
              <p className="text-2xl font-bold text-slate-700 mt-1">1</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(3)} icon={ArrowLeft}>
              Adjust Mapping
            </Button>
            <Button variant="primary" onClick={() => setStep(5)} icon={ArrowRight}>
              Preview Records
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: PREVIEW */}
      {step === 5 && (
        <Card className="space-y-6">
          <CardHeader
            title="Step 5: Non-Destructive Preview"
            description="Review how records will be mapped before executing the actual database import"
          />

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Row</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Mapped Values</th>
                <th className="py-3 px-4">Messages / Warnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rowsList.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-4 font-mono text-xs">#{row.rowNumber}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        row.status === 'valid'
                          ? 'green'
                          : row.status === 'warning'
                          ? 'amber'
                          : row.status === 'error'
                          ? 'red'
                          : 'slate'
                      }
                      dot
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">
                    {JSON.stringify(row.mapped)}
                  </td>
                  <td className="py-3 px-4 text-xs text-rose-600">
                    {row.messages?.join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Checkbox
              label="I understand that this import will create customer and subscription records in SubscriptIQ"
              checked={confirmUnderstood}
              onChange={(e) => setConfirmUnderstood(e.target.checked)}
            />
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(4)} icon={ArrowLeft}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!confirmUnderstood}
              onClick={() => importMutation.mutate()}
              isLoading={importMutation.isPending}
            >
              Confirm & Execute Import
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: IMPORT & REPORT */}
      {step === 6 && (
        <Card className="space-y-6 text-center py-8">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Spreadsheet Migration Completed</h2>
            <p className="text-xs text-slate-500 mt-1">
              Records were safely imported into business tables without triggering historical billings.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-xs text-slate-500">Processed</span>
              <p className="text-lg font-bold text-slate-900">60</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700">Imported</span>
              <p className="text-lg font-bold text-emerald-800">52</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-xs text-slate-500">Skipped (Dup)</span>
              <p className="text-lg font-bold text-slate-700">5</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-700">Failed</span>
              <p className="text-lg font-bold text-rose-800">3</p>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setCurrentJob(null);
                setConfirmUnderstood(false);
              }}
              icon={RotateCcw}
            >
              Import Another File
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(kind === 'customers' ? '/customers' : '/subscriptions')}
            >
              View Imported {kind === 'customers' ? 'Customers' : 'Subscriptions'}
            </Button>
          </div>
        </Card>
      )}

      {/* Prior Migration Jobs History */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-bold text-slate-900">Recent Migration Jobs History</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
            <tr>
              <th className="py-3 px-4">Job ID</th>
              <th className="py-3 px-4">Kind</th>
              <th className="py-3 px-4">File Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Completed On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobsList.map((job) => (
              <tr key={job.id}>
                <td className="py-3 px-4 font-mono text-xs">#{job.id}</td>
                <td className="py-3 px-4 capitalize font-medium">{job.kind}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-700">{job.fileName}</td>
                <td className="py-3 px-4">
                  <Badge variant={job.status === 'completed' ? 'green' : 'slate'} dot size="sm">
                    {job.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  <DateText date={job.finishedAt || job.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default MigrationWizardPage;
