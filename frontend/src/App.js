import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context';
import { useAuth } from './hooks';
import { AuthPage, HomePage } from './pages';
import './App.css';

/**
 * App Content Component - Uses auth context
 */
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <AuthPage />} />
      <Route path="/home/*" element={isAuthenticated ? <HomePage /> : <Navigate to="/" />} />
      <Route path="*" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/" />} />
    </Routes>
  );
}

/**
 * App Component - Wraps with AuthProvider and Router
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
