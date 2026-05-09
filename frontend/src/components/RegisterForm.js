import React, { useState } from 'react';
import { authApi } from '../services';
import { validateEmail, validatePassword, validateUsername } from '../utils';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!validateUsername(username))    { setError('Username must be 3–20 characters'); return; }
    if (!validateEmail(email))          { setError('Please enter a valid email'); return; }
    if (!validatePassword(password))    { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword)   { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await authApi.register(username, email, password);
      if (result.success) {
        onSuccess(result.data.user, result.data.token);
      } else {
        setError(result.error || 'Registration failed');
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
        <p className="auth-eyebrow">Get started</p>
        <h1>Create account</h1>
        <p className="auth-form-sub">Fill in your details to register</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="johndoe"
            required
            disabled={loading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?
        <button type="button" onClick={onSwitchToLogin}>Sign in</button>
      </p>
    </div>
  );
};

export default RegisterForm;
