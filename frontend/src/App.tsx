import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationToast } from './components/NotificationToast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PageSkeleton } from './components/common/Skeleton';

// Route-level code splitting & lazy loading
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PostsPage = lazy(() => import('./pages/PostsPage').then((m) => ({ default: m.PostsPage })));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage').then((m) => ({ default: m.CreatePostPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const MediaPage = lazy(() => import('./pages/MediaPage').then((m) => ({ default: m.MediaPage })));
const InstagramConnectPage = lazy(() => import('./pages/InstagramConnectPage').then((m) => ({ default: m.InstagramConnectPage })));
const PlansPage = lazy(() => import('./pages/PlansPage').then((m) => ({ default: m.PlansPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Persistent open state from localStorage (defaults to true on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('instamngmt_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth > 900;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('instamngmt_sidebar_open', String(next));
      } catch (e) {
        console.warn('Failed to save sidebar state to localStorage', e);
      }
      return next;
    });
  };

  // Keyboard shortcut: Ctrl+[ or Cmd+[ toggles sidebar (matching ChatGPT)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === 'Escape' && isSidebarOpen && window.innerWidth <= 900) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  if (loading) {
    return (
      <div className="chatgpt-layout-root" style={{ padding: 'var(--space-6)', alignItems: 'center', justifyContent: 'center' }}>
        <PageSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="chatgpt-layout-root">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      <div className="main-content-wrapper">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="main-content">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <NotificationToast />
          <Suspense fallback={<div style={{ padding: 'var(--space-8)' }}><PageSkeleton /></div>}>
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
          </Suspense>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};
