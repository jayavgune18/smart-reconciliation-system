import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import Reconciliation from './components/Reconciliation';
import ReconciliationDetail from './components/ReconciliationDetail';
import Audit from './components/Audit';
import AuditTimeline from './components/AuditTimeline';
import Login from './components/Login';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Navbar from './components/Navbar';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleProtectedRoute allowedRoles={['Admin', 'Analyst', 'Viewer']}><Dashboard /></RoleProtectedRoute>} />
      <Route path="/upload" element={<RoleProtectedRoute allowedRoles={['Admin', 'Analyst']}><Upload /></RoleProtectedRoute>} />
      <Route path="/reconcile" element={<RoleProtectedRoute allowedRoles={['Admin', 'Analyst']}><Reconciliation /></RoleProtectedRoute>} />
      <Route path="/reconcile/:jobId" element={<RoleProtectedRoute allowedRoles={['Admin', 'Analyst']}><ReconciliationDetail /></RoleProtectedRoute>} />
      <Route path="/audit" element={<RoleProtectedRoute allowedRoles={['Admin']}><Audit /></RoleProtectedRoute>} />
      <Route path="/audit-detail/:recordId" element={<RoleProtectedRoute allowedRoles={['Admin']}><AuditTimeline /></RoleProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;