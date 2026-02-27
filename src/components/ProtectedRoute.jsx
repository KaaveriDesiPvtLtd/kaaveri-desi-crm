import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldX } from 'lucide-react';

const ProtectedRoute = ({ children, resource, action = 'read' }) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a resource is specified, check permission
  if (resource && !hasPermission(resource, action)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            You don't have permission to access this page. Contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
