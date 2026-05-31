import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HouseDetails from './pages/HouseDetails';
import BudgetManagement from './pages/BudgetManagement';
import BookPage from './pages/BookPage';
import BalancePage from './pages/BalancePage';

const Guard = ({ pub, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (pub) return user ? <Navigate to="/dashboard" /> : children;
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login"    element={<Guard pub><Login /></Guard>} />
          <Route path="/register" element={<Guard pub><Register /></Guard>} />
          <Route path="/dashboard"              element={<Guard><Dashboard /></Guard>} />
          <Route path="/house/:houseId"         element={<Guard><HouseDetails /></Guard>} />
          <Route path="/house/:houseId/budget"  element={<Guard><BudgetManagement /></Guard>} />
          <Route path="/house/:houseId/balances"element={<Guard><BalancePage /></Guard>} />
          <Route path="/house/:houseId/book"    element={<Guard><BookPage /></Guard>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
