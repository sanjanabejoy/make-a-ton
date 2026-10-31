import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  HelpCircle,
  Search,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';

export function InsightsPage() {
  const [selectedQuestionId, setSelectedQuestionId] = useState('active_subscriptions');
  const [freeText, setFreeText] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch canned questions
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['insightsQuestions'],
    queryFn: async () => {
      try {
        const res = await http.get('/insights/questions');
        return res.data || res;
      } catch {
        return [
          { id: 'active_subscriptions', question: 'How many active subscriptions do we have?' },
          { id: 'overdue_invoices', question: 'Which invoices are overdue?' },
          { id: 'outstanding_amount', question: 'How much money is outstanding?' },
          { id: 'top_plans_revenue', question: 'Which plans generate the most revenue?' },
          { id: 'upcoming_renewals', question: 'What renewals are coming up?' },
          { id: 'repeat_overdue_customers', question: 'Which customers repeatedly pay late?' },
        ];
      }
    },
  });

  const questions = Array.isArray(questionsData)
    ? questionsData
    : questionsData?.questions || [];

  // Active answer query
  const { data: answerData, isLoading: answerLoading, refetch } = useQuery({
    queryKey: ['insightsAnswer', selectedQuestionId],
    queryFn: async () => {
      setErrorMsg(null);
      const res = await http.post('/insights/ask', { questionId: selectedQuestionId });
      return res.data || res;
    },
    enabled: !!selectedQuestionId,
  });

  // Free text ask mutation
  const askMutation = useMutation({
    mutationFn: async (text) => {
      setErrorMsg(null);
      const res = await http.post('/insights/ask', { text });
      return res.data || res;
    },
    onSuccess: (data) => {
      if (data?.questionId) {
        setSelectedQuestionId(data.questionId);
      }
    },
    onError: (err) => {
      setErrorMsg(
        err.message || 'Supported questions: active subscriptions, overdue invoices, outstanding amount, top plans, upcoming renewals, repeat overdue.'
      );
    },
  });

  const handleFreeTextSubmit = (e) => {
    e.preventDefault();
    if (!freeText.trim()) return;
    askMutation.mutate(freeText.trim());
  };

  const answer = askMutation.data || answerData || null;

  const renderCellValue = (col, val) => {
    if (val === undefined || val === null) return '—';
    switch (col.type) {
      case 'money':
        return <Money amount={val} />;
      case 'date':
        return <DateText date={val} />;
      case 'badge':
        return <Badge variant="blue" size="sm">{val}</Badge>;
      case 'link':
        return (
          <Link to={val.href} className="text-indigo-600 hover:underline font-medium">
            {val.label || val}
          </Link>
        );
      default:
        return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-soft">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Revenue Intelligence & Insights
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Ask canned revenue intelligence questions backed by strict SQL analytics. Certified accurate calculations — zero hallucinated figures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Question Selector & Free-text box */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Curated Revenue Questions
              </h3>
              <div className="space-y-2">
                {questionsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  questions.map((q) => {
                    const isSelected = selectedQuestionId === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setSelectedQuestionId(q.id);
                          setFreeText('');
                          setErrorMsg(null);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition border flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{q.question}</span>
                        <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Free Text Question Input */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                Ask in Natural Language
              </h4>
              <form onSubmit={handleFreeTextSubmit} className="space-y-2">
                <input
                  type="text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="e.g. Which customers are overdue?..."
                  className="w-full py-2 px-3 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white text-slate-900"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={askMutation.isPending}
                >
                  Analyze Query
                </Button>
              </form>
            </div>
          </Card>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                Query Not Recognized
              </p>
              <p className="text-[11px] leading-relaxed">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Right Side: Answer Card */}
        <div className="lg:col-span-8">
          {(answerLoading || askMutation.isPending) ? (
            <Card className="p-8 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </Card>
          ) : !answer ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              Select an insights question on the left to review metrics and data.
            </Card>
          ) : (
            <Card className="p-6 space-y-6">
              {/* Question & Answer Header */}
              <div className="pb-4 border-b border-slate-200">
                <Badge variant="purple" size="sm" className="mb-2">
                  Verified SQL Metric
                </Badge>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {answer.title || 'Insights Analysis'}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                  {answer.answerText}
                </p>

                {/* Audit As-of & Filters Used */}
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>As of: {answer.asOfDate || 'Today'}</span>
                  {answer.filtersUsed && <span>• Filters: {answer.filtersUsed}</span>}
                </div>
              </div>

              {/* Metrics Stat Tiles */}
              {answer.metrics && answer.metrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {answer.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200/80"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {m.label}
                      </span>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">
                        {typeof m.value === 'number' && m.isMoney ? (
                          <Money amount={m.value} />
                        ) : (
                          m.value
                        )}
                      </p>
                      {m.change && (
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          {m.change}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Data Rows Table */}
              {answer.columns && answer.rows && answer.rows.length > 0 && (
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          {answer.columns.map((col) => (
                            <th
                              key={col.key}
                              className={`py-2.5 px-4 ${
                                col.type === 'money' || col.type === 'number'
                                  ? 'text-right'
                                  : ''
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {answer.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/70 transition">
                            {answer.columns.map((col) => (
                              <td
                                key={col.key}
                                className={`py-3 px-4 ${
                                  col.type === 'money' || col.type === 'number'
                                    ? 'text-right font-semibold text-slate-900'
                                    : 'font-medium'
                                }`}
                              >
                                {renderCellValue(col, row[col.key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Relevant Navigation Links */}
              {answer.links && answer.links.length > 0 && (
                <div className="pt-4 border-t border-slate-200 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500">Related Actions:</span>
                  {answer.links.map((link, lIdx) => (
                    <Link key={lIdx} to={link.href}>
                      <Button variant="outline" size="sm" icon={ExternalLink}>
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default InsightsPage;
