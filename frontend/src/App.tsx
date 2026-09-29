import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PostsPage } from './pages/PostsPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { CalendarPage } from './pages/CalendarPage';
import { MediaPage } from './pages/MediaPage';
import { InstagramConnectPage } from './pages/InstagramConnectPage';
import { PlansPage } from './pages/PlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Authenticating Session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/posts" element={<ProtectedLayout><PostsPage /></ProtectedLayout>} />
          <Route path="/posts/create" element={<ProtectedLayout><CreatePostPage /></ProtectedLayout>} />
          <Route path="/calendar" element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} />
          <Route path="/media" element={<ProtectedLayout><MediaPage /></ProtectedLayout>} />
          <Route path="/instagram/accounts" element={<ProtectedLayout><InstagramConnectPage /></ProtectedLayout>} />
          <Route path="/plans" element={<ProtectedLayout><PlansPage /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
          <Route path="/admin/settings" element={<ProtectedLayout><AdminSettingsPage /></ProtectedLayout>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
