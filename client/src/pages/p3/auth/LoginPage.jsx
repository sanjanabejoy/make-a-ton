import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Card from '../../../components/ui/Card';

export function LoginPage() {
  const { login, getHomeRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      const destination = from || getHomeRoute(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-xl bg-indigo-600 items-center justify-center text-white shadow-soft mb-4">
          <Zap className="h-7 w-7 fill-current" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to SubscriptIQ
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Intelligent Subscription Operations & Revenue Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 sm:px-10 space-y-6">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email address" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.test"
                  className="pl-9"
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
                  placeholder="•••••••••"
                  className="pl-9"
                />
              </div>
            </FormField>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Session valid for 8 hours</span>
              <Link
                to="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Demo Accounts (One-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@brightloop.test', 'Admin@12345')}
                className="py-1.5 px-2 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-700 transition text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('staff@brightloop.test', 'Staff@12345')}
                className="py-1.5 px-2 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-700 transition text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('customer@brightloop.test', 'Customer@12345')}
                className="py-1.5 px-2 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-700 transition text-center"
              >
                Customer
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Customer needing an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
