'use client';

import { Activity, Users, Clock, AlertCircle } from 'lucide-react';

interface StatsOverviewProps {
  data: any;
}

export default function StatsOverview({ data }: StatsOverviewProps) {
  if (!data) return null;

  const stats = [
    {
      name: 'Active Triages',
      value: data.activeTriages || 0,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Completed Today',
      value: data.todayStats?.completed_today || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Avg Wait Time',
      value: data.todayStats?.avg_wait_time 
        ? `${Math.round(data.todayStats.avg_wait_time / 60)} min`
        : 'N/A',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Critical Cases',
      value: data.triagesByLevel?.find((l: any) => l.triage_level === '1')?.count || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

