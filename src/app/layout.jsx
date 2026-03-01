"use client";

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import axios from 'axios';
import './globals.css';

// Configure global API base URL from environment
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Kaaveri Desi CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
