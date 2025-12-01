'use client';

import { useState, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Camera, Upload, X } from 'lucide-react';
import { api } from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function MobileTriagePage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleVideoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!patientId || !chiefComplaint) {
      setError('Patient ID and chief complaint are required');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('chiefComplaint', chiefComplaint);
      if (additionalNotes) {
        formData.append('additionalNotes', additionalNotes);
      }
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await api.post('/triage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push(`/dashboard/triage/${response.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create triage assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Mobile Triage Assessment
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter patient ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chief Complaint
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe the patient's main complaint..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any additional observations..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Video (Optional)
              </label>
              {videoPreview ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleVideoCapture}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Tap to capture video</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                capture="environment"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Submit Triage'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

