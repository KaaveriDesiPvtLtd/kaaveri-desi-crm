import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<ProtectedRoute resource="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute resource="inventory"><Inventory /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute resource="orders"><Orders /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute resource="reports"><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute resource="settings"><Settings /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute resource="users"><UserManagement /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
