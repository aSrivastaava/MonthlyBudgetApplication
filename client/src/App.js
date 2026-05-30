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

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/house/:houseId" element={<PrivateRoute><HouseDetails /></PrivateRoute>} />
          <Route path="/house/:houseId/budget" element={<PrivateRoute><BudgetManagement /></PrivateRoute>} />
          <Route path="/house/:houseId/balances" element={<PrivateRoute><BalancePage /></PrivateRoute>} />
          <Route path="/house/:houseId/book" element={<PrivateRoute><BookPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
