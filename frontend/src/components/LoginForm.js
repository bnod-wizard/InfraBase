import React, { useState } from 'react';
import { authApi } from '../services';
import { validateEmail, validatePassword } from '../utils';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email))       { setError('Please enter a valid email'); return; }
    if (!validatePassword(password)) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      if (result.success) {
        onSuccess(result.data.user, result.data.token);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrap">
      <div className="auth-form-header">
        <p className="auth-eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="auth-form-sub">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

    </div>
  );
};

export default LoginForm;
