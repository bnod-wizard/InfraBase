/**
 * HomePage - Main page after login
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CustomersPage from './CustomersPage';
import CustomerDetailPage from './CustomerDetailPage';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/home" element={<DashboardContent />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
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
        <p>Manage your customers efficiently with our comprehensive customer management system.</p>
        <div className="features-list">
          <h3>Features:</h3>
          <ul>
            <li>✅ Add and manage customers</li>
            <li>✅ View detailed customer information</li>
            <li>✅ Edit and delete customer records</li>
            <li>✅ Generate professional PDFs (Letterhead, Cover, Report)</li>
            <li>✅ Search and filter customers</li>
            <li>✅ Track customer status (Active, Inactive, Prospect)</li>
          </ul>
        </div>
        <p className="start-message">Navigate to <strong>Customers</strong> to get started!</p>
      </div>
    </div>
  );
};

export default HomePage;
