import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User, Check, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Card from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live password validation checks
  const checks = [
    { label: 'Minimum 9 characters (length > 8)', passed: password.length >= 9 },
    { label: 'At least 1 uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
    { label: 'At least 1 lowercase letter (a-z)', passed: /[a-z]/.test(password) },
    { label: 'At least 1 special character (!@#$%^&*)', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const allPassed = checks.every((c) => c.passed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setGeneralError('');

    if (!allPassed) {
      setGeneralError('Please ensure your password meets all complexity requirements.');
      return;
    }

    setIsLoading(true);
    try {
      await register({ name, email, password });
      navigate('/portal');
    } catch (err) {
      if (err.status === 409 || err.code === 'CONFLICT') {
        setEmailError('This email is already registered. Please log in instead.');
      } else {
        setGeneralError(err.message || 'Registration failed. Please try again.');
      }
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
          Create Customer Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Get direct access to your subscriptions, invoices, and billing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 sm:px-10 space-y-6">
          {generalError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sanika Verma"
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField label="Email address" required error={emailError}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="sanika@example.com"
                  className="pl-9"
                  error={!!emailError}
                />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="pl-9"
                />
              </div>

              {/* Live Password Checklist */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
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

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={!allPassed}
              icon={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
