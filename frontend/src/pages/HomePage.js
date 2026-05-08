/**
 * HomePage - Main page after login
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AccountsPage from './AccountsPage';
import AccountDetailPage from './AccountDetailPage';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="sidebar-shell">
        <Sidebar />
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:accountId" element={<AccountDetailPage />} />
        </Routes>
      </div>
    </div>
  );
};

const DashboardContent = () => {
  return (
    <div className="dashboard-content">
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Team performance overview</h1>
            <p className="page-copy">Mon, Nov 6, 2023 – Sun, Nov 12, 2023</p>
          </div>
          <div className="page-actions">
            <button className="icon-button">🔍</button>
            <button className="icon-button">📩</button>
            <button className="icon-button">📝</button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="top-card balance-card">
              <div>
                <p className="card-label">Total balance</p>
                <h2>$23,651</h2>
              </div>
              <button className="ghost-button">•••</button>
            </div>

            <div className="chart-card">
              <div className="card-row">
                <div>
                  <p className="card-label">Time</p>
                  <h3>5:17 today</h3>
                </div>
                <div className="mini-badge">Today</div>
              </div>
              <div className="chart-grid">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, index) => (
                  <div key={day} className={`chart-bar bar-${index % 4}`}>
                    <span>{day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="table-card">
              <div className="card-row">
                <div>
                  <p className="card-label">Last tasks</p>
                  <h3>8 total, proceed to resolve them</h3>
                </div>
                <div className="table-meta">
                  <span>5 Done</span>
                  <span>3 In progress</span>
                </div>
              </div>
              <div className="task-table">
                <div className="table-header">
                  <span>Name</span>
                  <span>Status</span>
                  <span>Time</span>
                  <span>Finish</span>
                </div>
                {[
                  { name: 'Redesign main page', assignee: 'Dianne R.', status: 'In progress', time: '8h', finish: '13 Mon' },
                  { name: 'Meeting with HR', assignee: 'Jenny W.', status: 'Done', time: '2h', finish: '08 Tue' },
                  { name: 'Make changes for developers', assignee: 'Ronald R.', status: 'In progress', time: '4h', finish: '18 Fri' },
                  { name: 'Mentorship', assignee: 'Eleanor P.', status: 'To do', time: '10h', finish: '27 Tue' }
                ].map((task) => (
                  <div key={task.name} className="table-row">
                    <span>{task.name}</span>
                    <span>{task.status}</span>
                    <span>{task.time}</span>
                    <span>{task.finish}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="dashboard-side">
            <div className="side-card status-card">
              <p className="card-label">Task</p>
              <h3>94%</h3>
              <div className="status-items">
                <span>To do 54%</span>
                <span>In progress 84%</span>
                <span>Finish date 78%</span>
              </div>
            </div>

            <div className="side-row">
              <div className="side-card progress-metric">
                <p>Weekly activity</p>
                <h3>64%</h3>
              </div>
              <div className="side-card progress-metric">
                <p>Worked this week</p>
                <h3>26:43</h3>
              </div>
              <div className="side-card progress-metric">
                <p>Focus time</p>
                <h3>77%</h3>
              </div>
            </div>

            <div className="side-card mini-card dark-card">
              <p>Per month</p>
              <div className="metric-list">
                <span>9+ Project</span>
                <span>23+ Task</span>
              </div>
            </div>

            <div className="side-card achievement-card">
              <p>Achievements</p>
              <div className="achievement-grid">
                <div className="badge">⭐</div>
                <div className="badge">🚀</div>
                <div className="badge">📈</div>
                <div className="badge">🏆</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
