'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TriageQueue from '@/components/dashboard/TriageQueue';
import StatsOverview from '@/components/dashboard/StatsOverview';
import { api } from '@/utils/api';
import { io, Socket } from 'socket.io-client';

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    // Initialize Socket.IO
    const token = localStorage.getItem('token');
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    const newSocket = io(wsUrl, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('triage:new', (data) => {
      console.log('New triage:', data);
      fetchDashboardData();
    });

    newSocket.on('triage:updated', (data) => {
      console.log('Triage updated:', data);
      fetchDashboardData();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/overview');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>

        <StatsOverview data={dashboardData} />

        <TriageQueue data={dashboardData} />
      </div>
    </DashboardLayout>
  );
}

