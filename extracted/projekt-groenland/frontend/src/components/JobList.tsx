'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Job {
  id: number;
  title: string;
  employer_name: string;
  location: string;
  employment_type: string;
  published_at: string;
}

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs`
        );
        setJobs(response.data.data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Lädt...</div>;
  }

  return (
    <div className="mt-8 space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {job.title}
          </h3>
          <p className="text-gray-600 mb-2">{job.employer_name}</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>📍 {job.location}</span>
            <span>💼 {job.employment_type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
