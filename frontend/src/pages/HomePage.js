/**
 * HomePage - Main page after login
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AccountsPage from './AccountsPage';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="accounts" element={<AccountsPage />} />
        </Routes>
      </div>
    </div>
  );
};

const DashboardContent = () => {
  return (
    <div className="dashboard-content">
      <h1>Dashboard</h1>
      <div className="welcome-card">
        <h2>Welcome to InfraBase</h2>
        <p>Manage your accounts and properties efficiently with our comprehensive management system.</p>
        <div className="features-list">
          <h3>Features:</h3>
          <ul>
            <li>✅ Create and manage accounts</li>
            <li>✅ Add multiple clients per account</li>
            <li>✅ Register properties with detailed information</li>
            <li>✅ Manage multiple property owners</li>
            <li>✅ Hierarchical data organization (Account → Client → Property → Owner)</li>
            <li>✅ Search and filter accounts</li>
            <li>✅ Track account status</li>
          </ul>
        </div>
        <p className="start-message">Navigate to <strong>Accounts</strong> to get started!</p>
      </div>
    </div>
  );
};

export default HomePage;
