/**
 * AuthPage - Container for Login and Register
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks';
import { LoginForm, RegisterForm } from '../components';
import '../styles/AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleAuthSuccess = (userData, token) => {
    login(userData, token);
  };

  return (
    <div className="auth-container">
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
  );
};

export default AuthPage;
