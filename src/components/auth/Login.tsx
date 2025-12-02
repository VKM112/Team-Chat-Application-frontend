import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { FormEvent } from 'react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(() => email.trim() && password.trim(), [email, password]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      setError('Please fill in both fields');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError('Unable to log in. Check credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-slate-900 p-8 text-slate-100 shadow-xl">
        <h1 className="text-center text-3xl font-semibold text-emerald-300">Mini Team Chat</h1>
        <p className="text-center text-sm text-slate-400">
          Enter your workspace credentials to start chatting.
        </p>

        {error && (
          <div className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="text-center text-xs text-slate-400">
          New here?{' '}
          <Link to="/signup" className="text-emerald-300 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
