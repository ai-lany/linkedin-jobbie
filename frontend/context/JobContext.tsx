import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { Job, SwipeDirection, EasyApplyData } from '../types/job';

interface SavedJob {
  job: Job;
  savedAt: string;
}

interface AppliedJob {
  job: Job;
  appliedAt: string;
  applicationData: EasyApplyData;
  status: 'pending' | 'completed' | 'failed';
  applicationId?: string;
}

interface JobContextType {
  // Jobs to swipe
  jobs: Job[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;

  // Saved jobs
  savedJobs: SavedJob[];
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;

  // Applied jobs
  appliedJobs: AppliedJob[];
  applyToJob: (job: Job, data: EasyApplyData, status?: 'pending' | 'completed' | 'failed', applicationId?: string) => void;
  isJobApplied: (jobId: string) => boolean;
  updateApplicationStatus: (jobId: string, status: 'pending' | 'completed' | 'failed', applicationId?: string, applicationData?: Partial<EasyApplyData>) => void;

  // Swipe history for undo
  swipeHistory: { job: Job; direction: SwipeDirection }[];

  // Actions
  handleSwipe: (direction: SwipeDirection) => void;
  handleUndo: () => void;
  canUndo: boolean;
  hasMoreJobs: boolean;
  currentJob: Job | undefined;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

// Transform backend job data to frontend Job type
function transformBackendJob(id: string, backendJob: any): Job {
  // Handle company - it could be a populated object or just an ID
  const companyName = typeof backendJob.company === 'object' && backendJob.company !== null
    ? (backendJob.company.name || 'Unknown Company')
    : (typeof backendJob.company === 'string' ? backendJob.company : 'Unknown Company');

  const companyId = typeof backendJob.company === 'object' && backendJob.company !== null
    ? String(backendJob.company._id || '')
    : String(backendJob.company || '');

  // Generate logo URL from company name - return empty string if unknown
  const logoUrl = companyName !== 'Unknown Company'
    ? `https://logo.clearbit.com/${companyName.toLowerCase().replace(/\s+/g, '')}.com`
    : '';

  // Ensure all company fields are strings
  const companyIndustry = typeof backendJob.company === 'object' && backendJob.company?.industry
    ? String(backendJob.company.industry)
    : 'Technology';

  const companySize = typeof backendJob.company === 'object' && backendJob.company?.size
    ? String(backendJob.company.size)
    : 'Unknown';

  const companyLocation = typeof backendJob.company === 'object' && backendJob.company?.location
    ? String(backendJob.company.location)
    : (backendJob.location ? String(backendJob.location) : 'Remote');

  // Ensure arrays contain only strings
  const highlights = Array.isArray(backendJob.highlights)
    ? backendJob.highlights.filter((h: any) => typeof h === 'string' && h.length > 0).slice(0, 5)
    : [];

  const skills = Array.isArray(backendJob.skills)
    ? backendJob.skills.filter((s: any) => typeof s === 'string' && s.length > 0).slice(0, 10)
    : [];

  // Safely get poster username
  const posterUsername = backendJob.postedBy?.username
    ? String(backendJob.postedBy.username)
    : 'Unknown';

  // Handle company data - it can be populated object or just an ID
  const companyData = typeof backendJob.company === 'object' && backendJob.company !== null
    ? backendJob.company
    : { name: 'Unknown Company', location: 'Unknown', industry: 'Unknown', size: 'Unknown' };

  // Map jobType to employmentType format
  const employmentTypeMap: { [key: string]: 'full-time' | 'part-time' | 'contract' | 'internship' } = {
    'Full-time': 'full-time',
    'Part-time': 'part-time',
    'Contract': 'contract',
    'Internship': 'internship',
  };

  return {
    id,
    title: backendJob.title || 'Untitled Position',
    company: {
      id: companyData._id || companyData.id || 'unknown',
      name: companyName,
      logo: logoUrl,
      industry: companyData.industry || 'Unknown',
      location: companyData.location || 'Unknown',
    },
    location: companyLocation || 'Unknown',
    locationType: backendJob.locationType || '', // Default since backend doesn't have this field
    salary: backendJob.salary || null, // Backend doesn't have salary data
    postedAt: backendJob.createdAt || new Date().toISOString(),
    applicants: backendJob.numberOfApplicants || 0,
    easyApply: backendJob.questions && backendJob.questions.length > 0,
    applicationType: backendJob.applicationType || 'direct', // 'direct' or 'external'
    highlights: [""],
    skills: [], // Could parse from description in the future
    experienceLevel: 'mid-senior', // Default since backend doesn't have this field
    employmentType: employmentTypeMap[backendJob.jobType] || 'full-time',
    description: backendJob.description || '',
    responsibilities: [], // Could parse from description in the future
    qualifications: [], // Could parse from description in the future
    benefits: [], // Backend doesn't have benefits data
    aboutCompany: companyData.description || `Posted by ${backendJob.postedBy?.username || 'Unknown'}`,
    questions: backendJob.questions || [],
  };
}

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<{ job: Job; direction: SwipeDirection }[]>([]);

  const currentJob = jobs[currentIndex];
  const hasMoreJobs = currentIndex < jobs.length;
  // Can only undo if there's history and the last swipe wasn't an application (right swipe)
  const canUndo = swipeHistory.length > 0 && swipeHistory[swipeHistory.length - 1].direction !== 'right';

  const saveJob = useCallback((job: Job) => {
    setSavedJobs((prev) => {
      // Don't add duplicates
      if (prev.some((s) => s.job.id === job.id)) return prev;
      return [...prev, { job, savedAt: new Date().toISOString() }];
    });
  }, []);

  const unsaveJob = useCallback((jobId: string) => {
    setSavedJobs((prev) => prev.filter((s) => s.job.id !== jobId));
  }, []);

  const isJobSaved = useCallback(
    (jobId: string) => savedJobs.some((s) => s.job.id === jobId),
    [savedJobs]
  );

  const applyToJob = useCallback((
    job: Job,
    data: EasyApplyData,
    status: 'pending' | 'completed' | 'failed' = 'completed',
    applicationId?: string
  ) => {
    setAppliedJobs((prev) => {
      if (prev.some((a) => a.job.id === job.id)) return prev;
      return [...prev, {
        job,
        appliedAt: new Date().toISOString(),
        applicationData: data,
        status,
        applicationId
      }];
    });
    // Remove from saved if it was saved
    setSavedJobs((prev) => prev.filter((s) => s.job.id !== job.id));
  }, []);

  const updateApplicationStatus = useCallback((
    jobId: string,
    status: 'pending' | 'completed' | 'failed',
    applicationId?: string,
    applicationData?: Partial<EasyApplyData>
  ) => {
    setAppliedJobs((prev) =>
      prev.map(app =>
        app.job.id === jobId
          ? {
              ...app,
              status,
              applicationId: applicationId || app.applicationId,
              ...(applicationData && {
                applicationData: {
                  ...app.applicationData,
                  ...applicationData
                }
              })
            }
          : app
      )
    );
  }, []);

  const isJobApplied = useCallback(
    (jobId: string) => appliedJobs.some((a) => a.job.id === jobId),
    [appliedJobs]
  );

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentJob) return;

      setSwipeHistory((prev) => [...prev, { job: currentJob, direction }]);
      setCurrentIndex((prev) => prev + 1);

      if (direction === 'up') {
        // Save the job
        saveJob(currentJob);
      }
    },
    [currentJob, saveJob]
  );

  const handleUndo = useCallback(() => {
    if (swipeHistory.length > 0) {
      const lastSwipe = swipeHistory[swipeHistory.length - 1];

      // If the last action was a save, remove from saved
      if (lastSwipe.direction === 'up') {
        unsaveJob(lastSwipe.job.id);
      }

      setSwipeHistory((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);
    }
  }, [swipeHistory, unsaveJob]);

  // Prefer explicit env var; fall back to sensible platform defaults 
  const defaultBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultBaseUrl;

  // Fetch jobs from backend API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching jobs from:', `${apiBaseUrl}/jobs`);

        const response = await fetch(`${apiBaseUrl}/jobs`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log('Raw API response:', data);

        // Transform backend data to frontend Job type
        const transformedJobs: Job[] = Object.entries(data).map(([id, backendJob]: [string, any]) =>
          transformBackendJob(id, backendJob)
        );

        console.log('Transformed jobs:', transformedJobs);
        setJobs(transformedJobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [apiBaseUrl]);

  return (
    <JobContext.Provider
      value={{
        jobs,
        currentIndex,
        isLoading,
        error,
        savedJobs,
        saveJob,
        unsaveJob,
        isJobSaved,
        appliedJobs,
        applyToJob,
        isJobApplied,
        updateApplicationStatus,
        swipeHistory,
        handleSwipe,
        handleUndo,
        canUndo,
        hasMoreJobs,
        currentJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}