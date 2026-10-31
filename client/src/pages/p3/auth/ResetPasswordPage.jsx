import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Check, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import http from '../../../api/http';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Card from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checks = [
    { label: 'Minimum 9 characters (length > 8)', passed: password.length >= 9 },
    { label: 'At least 1 uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
    { label: 'At least 1 lowercase letter (a-z)', passed: /[a-z]/.test(password) },
    { label: 'At least 1 special character (!@#$%^&*)', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const allPassed = checks.every((c) => c.passed);
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allPassed) {
      setError('Please satisfy all password complexity rules.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await http.post('/auth/reset-password', { token, password });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Invalid or expired password reset token.');
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
          Set New Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose a secure password for your SubscriptIQ account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 sm:px-10 space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Password Updated Successfully</h3>
              <p className="text-xs text-slate-500">
                You can now log in using your newly configured credentials.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <FormField label="New Password" required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-9"
                  />
                </div>

                {/* Password rule checklist */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Requirements
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

              <FormField label="Confirm Password" required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pl-9"
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={!allPassed || !passwordsMatch}
                icon={ArrowRight}
              >
                Reset Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
