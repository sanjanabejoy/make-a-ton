import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Clock, CheckCircle2, Search, ArrowRight, ExternalLink } from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import DateText from '../../../components/ui/DateText';
import { Skeleton } from '../../../components/ui/Skeleton';
import Button from '../../../components/ui/Button';

export function DevMailboxPage() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch email logs
  const { data: emailsData, isLoading, refetch } = useQuery({
    queryKey: ['devEmails'],
    queryFn: async () => {
      try {
        const res = await http.get('/dev/emails');
        return res.data || res;
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const emails = Array.isArray(emailsData) ? emailsData : emailsData?.data || [];

  const filteredEmails = emails.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.toEmail?.toLowerCase().includes(q) ||
      e.subject?.toLowerCase().includes(q) ||
      e.kind?.toLowerCase().includes(q)
    );
  });

  const activeEmail = selectedEmail || filteredEmails[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-soft">
              <Mail className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Developer Mailbox
            </h1>
            <Badge variant="purple" size="sm">Admin Only</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Local email capture for testing authentication, password reset, automated reminders, and invoice notifications without an external SMTP gateway.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh Inbox
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Inbox List */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails by recipient or subject..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white"
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No simulated emails captured yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredEmails.map((email) => {
                  const isSelected = activeEmail?.id === email.id;

                  return (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-3.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">
                          {email.toEmail}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          <DateText date={email.createdAt} />
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {email.subject}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{email.kind || 'Notification'}</span>
                        {email.delivered ? (
                          <span className="text-emerald-600 font-medium">Delivered</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Captured in Dev</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Rendered Email Preview */}
        <div className="lg:col-span-7">
          {!activeEmail ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              Select an email from the list to view its rendered message and action links.
            </Card>
          ) : (
            <Card className="p-6 space-y-4">
              <div className="pb-4 border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="blue" size="sm">
                    {activeEmail.kind?.toUpperCase() || 'SIMULATED EMAIL'}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    <DateText date={activeEmail.createdAt} />
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  {activeEmail.subject}
                </h2>

                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <strong>To:</strong> <span className="font-mono text-slate-800">{activeEmail.toEmail}</span>
                  </p>
                  <p>
                    <strong>From:</strong> SubscriptIQ System &lt;no-reply@brightloop.test&gt;
                  </p>
                </div>
              </div>

              {/* Email HTML / Text Body with clickable link extraction */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {activeEmail.body}
              </div>

              {/* Detected links helper */}
              {activeEmail.body && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Actionable Hyperlinks in Message
                  </span>
                  <div className="space-y-1">
                    {activeEmail.body.split(/\s+/).filter(word => word.startsWith('http://') || word.startsWith('https://') || word.startsWith('/reset-password')).map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default DevMailboxPage;
