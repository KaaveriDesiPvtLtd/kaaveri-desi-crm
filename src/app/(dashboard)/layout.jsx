"use client";

import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Layout from '../../components/Layout';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute resource="dashboard">
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
}
