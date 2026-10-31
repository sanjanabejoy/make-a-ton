import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import http from '../../../api/http';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Card from '../../../components/ui/Card';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devResetLink, setDevResetLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await http.post('/auth/forgot-password', { email });
      setSubmitted(true);
      // In DEMO / mock mode, API might return devResetLink or token
      const payload = res.data || res;
      if (payload.devResetLink) {
        setDevResetLink(payload.devResetLink);
      } else if (payload.token) {
        setDevResetLink(`/reset-password/${payload.token}`);
      }
    } catch (err) {
      // MASTER_SPEC §7.3: Always 200 (no user enumeration)
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-xl bg-indigo-600 items-center justify-center text-white shadow-soft mb-4">
          <Zap className="h-7 w-7 fill-current" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 sm:px-10 space-y-6">
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-emerald-900">Reset instructions dispatched</h3>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                </p>
              </div>

              {devResetLink && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-amber-800">Demo Mode Helper:</p>
                  <p className="text-amber-700">Simulated email reset link:</p>
                  <Link
                    to={devResetLink}
                    className="block font-mono text-indigo-600 underline break-all mt-1 font-semibold"
                  >
                    {devResetLink}
                  </Link>
                </div>
              )}

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Email address" required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="pl-9"
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
