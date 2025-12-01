'use client';

import { useRouter } from 'next/navigation';
import { Clock, User, AlertCircle } from 'lucide-react';

interface TriageQueueProps {
  data: any;
}

export default function TriageQueue({ data }: TriageQueueProps) {
  const router = useRouter();

  if (!data || !data.waitingPatients) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Triage Queue</h2>
        <p className="text-gray-500">No patients in queue</p>
      </div>
    );
  }

  const getTriageLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '1': 'bg-red-100 text-red-800 border-red-300',
      '2': 'bg-orange-100 text-orange-800 border-orange-300',
      '3': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '4': 'bg-green-100 text-green-800 border-green-300',
      '5': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[level] || colors['3'];
  };

  const getTriageLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      '1': 'Immediate',
      '2': 'Very Urgent',
      '3': 'Urgent',
      '4': 'Semi-Urgent',
      '5': 'Non-Urgent',
    };
    return labels[level] || 'Unknown';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Triage Queue</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {data.waitingPatients.map((patient: any) => (
          <div
            key={patient.id}
            className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/dashboard/triage/${patient.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {patient.patient_name}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTriageLevelColor(
                        patient.triage_level
                      )}`}
                    >
                      Level {patient.triage_level} - {getTriageLevelLabel(patient.triage_level)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {patient.chief_complaint}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(patient.created_at).toLocaleTimeString()}
                    </span>
                    <span>Priority: {patient.priority_score}</span>
                  </div>
                </div>
              </div>
              {patient.triage_level === '1' && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

