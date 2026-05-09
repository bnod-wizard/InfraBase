import React, { useState } from 'react';
import { useAuth } from '../hooks';
import { LoginForm, RegisterForm } from '../components';
import '../styles/AuthForm.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleAuthSuccess = (userData, token) => {
    login(userData, token);
  };

  return (
    <div className="auth-page">
      {/* ── Brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-mark">I</div>
          <span>InfraBase</span>
        </div>

        <div className="auth-brand-body">
          <h2>Property Valuation<br />Management</h2>
          <p>Streamline assessments, generate valuation documents, and manage client accounts — all in one place.</p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-panel">
        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
