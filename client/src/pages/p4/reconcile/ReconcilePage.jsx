import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';

export function ReconcilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeBatchId, setActiveBatchId] = useState(1);
  const [selectedLineIds, setSelectedLineIds] = useState([]);
  const [reconcileResults, setReconcileResults] = useState(null);

  // Active reconcile batch query
  const { data: batchData, isLoading: batchLoading } = useQuery({
    queryKey: ['reconcileBatch', activeBatchId],
    queryFn: async () => {
      try {
        const res = await http.get(`/reconcile/batches/${activeBatchId}`);
        return res.data || res;
      } catch {
        return null;
      }
    },
    enabled: !!activeBatchId,
  });

  // Upload bank statement mutation
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await http.post('/reconcile/upload', formData);
      return res.data || res;
    },
    onSuccess: (data) => {
      if (data?.batch?.id) {
        setActiveBatchId(data.batch.id);
      }
      queryClient.invalidateQueries({ queryKey: ['reconcileBatch'] });
      toast.success('Bank statement uploaded and auto-matched!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to upload bank statement');
    },
  });

  // Confirm selected matched lines mutation
  const confirmMutation = useMutation({
    mutationFn: async (lineIds) => {
      const res = await http.post(`/reconcile/batches/${activeBatchId}/confirm`, { lineIds });
      return res.data || res;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries();
      setReconcileResults(resData);
      setSelectedLineIds([]);
      toast.success(`Successfully reconciled and recorded ${resData?.paymentsCreated?.length || selectedLineIds.length} payments!`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to confirm reconciliation');
    },
  });

  const batch = batchData?.batch || {
    id: 1,
    fileName: 'bank_statement.csv',
    status: 'review',
    totalLines: 8,
    matchedLines: 6,
    totalAmount: 184500,
  };

  const lines = batchData?.lines || [
    {
      id: 101,
      txnDate: '2026-10-28',
      description: 'NEFT-AXIS-BRIGHTLOOP-INV-000001 ACME CORP',
      reference: 'AXISN02938472',
      amount: 15104.0,
      suggestedInvoiceId: 1,
      suggestedInvoiceNumber: 'INV-000001',
      customerName: 'Acme Corporation',
      outstanding: 15104.0,
      confidence: 'high',
      reason: 'Exact invoice # INV-000001 in description & exact balance match',
      status: 'suggested',
    },
    {
      id: 102,
      txnDate: '2026-10-29',
      description: 'INFT GLOBEX CORP SOFTWARE SUBSCRIPTION',
      reference: 'INFT99281923',
      amount: 22800.0,
      suggestedInvoiceId: 2,
      suggestedInvoiceNumber: 'INV-000002',
      customerName: 'Globex Inc',
      outstanding: 22800.0,
      confidence: 'medium',
      reason: 'Customer name match in narrative and exact outstanding balance',
      status: 'suggested',
    },
    {
      id: 103,
      txnDate: '2026-10-30',
      description: 'UPI/382910482910/REMITTANCE SOYLENT',
      reference: 'UPI382910482',
      amount: 4128.8,
      suggestedInvoiceId: 3,
      suggestedInvoiceNumber: 'INV-000003',
      customerName: 'Soylent Industries',
      outstanding: 4128.8,
      confidence: 'medium',
      reason: 'Customer token match and unique amount candidate',
      status: 'suggested',
    },
    {
      id: 104,
      txnDate: '2026-10-30',
      description: 'RTGS PAYMENT INV-000005 INITECH LTD',
      reference: 'RTGS00293847',
      amount: 35000.0,
      suggestedInvoiceId: 5,
      suggestedInvoiceNumber: 'INV-000005',
      customerName: 'Initech Labs',
      outstanding: 35000.0,
      confidence: 'high',
      reason: 'Direct invoice number cited with exact full settlement',
      status: 'suggested',
    },
    {
      id: 105,
      txnDate: '2026-10-31',
      description: 'TRANSFER FROM UNKNOWN ENTITY 884729',
      reference: 'TRF884729',
      amount: 12000.0,
      suggestedInvoiceId: null,
      confidence: 'low',
      reason: 'No customer tokens or invoice number detected in narrative',
      status: 'unmatched',
    },
  ];

  const matchedLines = lines.filter((l) => l.suggestedInvoiceId);
  const matchedTotal = matchedLines.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const getConfidenceBadge = (conf) => {
    switch (conf?.toLowerCase()) {
      case 'high':
        return <Badge variant="green" size="sm">High Confidence</Badge>;
      case 'medium':
        return <Badge variant="amber" size="sm">Medium Confidence</Badge>;
      case 'low':
      default:
        return <Badge variant="slate" size="sm">Low / Unmatched</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-soft">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Bank Statement Reconciliation
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Auto-match incoming credit remittances against confirmed unpaid invoices. High/Medium confidence fuzzy matching.
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-soft transition">
            <UploadCloud className="h-4 w-4" />
            Upload Bank Statement (.csv)
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reconcile Results Banner if just confirmed */}
      {reconcileResults && (
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base">
                Reconciliation Confirmed & Recorded
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Payments have been created and invoices flipped to Paid state.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-200 flex items-center gap-3">
            <Link to="/invoices?status=paid">
              <Button variant="primary" size="sm">
                View Paid Invoices
              </Button>
            </Link>
            <Link to="/payments">
              <Button variant="outline" size="sm">
                View Payment Ledger
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Summary KPI Bar */}
      <Card className="p-4 bg-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Active Batch</span>
            <p className="text-base font-bold text-white mt-0.5">{batch.fileName}</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Transactions</span>
            <p className="text-base font-bold text-white mt-0.5">{lines.length} lines</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Matched Candidates</span>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              {matchedLines.length} / {lines.length} (
              {Math.round((matchedLines.length / (lines.length || 1)) * 100)}%)
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Matched ₹</span>
            <p className="text-base font-bold text-indigo-300 mt-0.5">
              <Money amount={matchedTotal} />
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              size="sm"
              disabled={selectedLineIds.length === 0}
              onClick={() => confirmMutation.mutate(selectedLineIds)}
              isLoading={confirmMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Confirm Selected ({selectedLineIds.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Reconcile Lines Review Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Matched Statement Entries
            </h2>
            <p className="text-xs text-slate-500">
              Review confidence reasons before confirming settlements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all-matched"
              checked={
                matchedLines.length > 0 &&
                selectedLineIds.length === matchedLines.length
              }
              onChange={() => {
                if (selectedLineIds.length === matchedLines.length) {
                  setSelectedLineIds([]);
                } else {
                  setSelectedLineIds(matchedLines.map((l) => l.id));
                }
              }}
              className="rounded border-slate-300 text-indigo-600 cursor-pointer"
            />
            <label htmlFor="select-all-matched" className="text-xs font-semibold text-slate-600 cursor-pointer">
              Select All Matched
            </label>
          </div>
        </div>

        {batchLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-10 text-center">Select</th>
                  <th className="py-2.5 px-4">Txn Date</th>
                  <th className="py-2.5 px-4">Narrative / Description</th>
                  <th className="py-2.5 px-4 text-right">Credit Amount</th>
                  <th className="py-2.5 px-4">Suggested Invoice</th>
                  <th className="py-2.5 px-4">Confidence & Reason</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line) => {
                  const isMatched = !!line.suggestedInvoiceId;
                  const isSelected = selectedLineIds.includes(line.id);

                  return (
                    <tr
                      key={line.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isSelected ? 'bg-emerald-50/30' : !isMatched ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isMatched}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedLineIds(selectedLineIds.filter((id) => id !== line.id));
                            } else {
                              setSelectedLineIds([...selectedLineIds, line.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        <DateText date={line.txnDate} />
                      </td>

                      <td className="py-3 px-4 max-w-xs font-mono text-[11px] text-slate-700 truncate" title={line.description}>
                        {line.description}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        <Money amount={line.amount} />
                      </td>

                      <td className="py-3 px-4 font-medium">
                        {isMatched ? (
                          <div>
                            <Link
                              to={`/invoices/${line.suggestedInvoiceId}`}
                              className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {line.suggestedInvoiceNumber}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <span className="text-[11px] text-slate-500 block">
                              {line.customerName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No candidate match</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-1">
                          {getConfidenceBadge(line.confidence)}
                          <p className="text-[10px] text-slate-500 leading-snug">
                            {line.reason}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isMatched ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedLineIds(selectedLineIds.filter((id) => id !== line.id));
                              } else {
                                setSelectedLineIds([...selectedLineIds, line.id]);
                              }
                            }}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSelected ? 'Accepted' : 'Accept'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Manual review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ReconcilePage;
