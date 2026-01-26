import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Job, SwipeDirection, EasyApplyData } from '../types/job';
import { mockJobs } from '../data/mockJobs';

interface SavedJob {
  job: Job;
  savedAt: string;
}

interface AppliedJob {
  job: Job;
  appliedAt: string;
  applicationData: EasyApplyData;
}

interface JobContextType {
  // Jobs to swipe
  jobs: Job[];
  currentIndex: number;

  // Saved jobs
  savedJobs: SavedJob[];
  saveJob: (job: Job) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;

  // Applied jobs
  appliedJobs: AppliedJob[];
  applyToJob: (job: Job, data: EasyApplyData) => void;
  isJobApplied: (jobId: string) => boolean;

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

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs] = useState<Job[]>(mockJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<{ job: Job; direction: SwipeDirection }[]>([]);

  const currentJob = jobs[currentIndex];
  const hasMoreJobs = currentIndex < jobs.length;
  const canUndo = swipeHistory.length > 0;

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

  const applyToJob = useCallback((job: Job, data: EasyApplyData) => {
    setAppliedJobs((prev) => {
      if (prev.some((a) => a.job.id === job.id)) return prev;
      return [...prev, { job, appliedAt: new Date().toISOString(), applicationData: data }];
    });
    // Remove from saved if it was saved
    setSavedJobs((prev) => prev.filter((s) => s.job.id !== job.id));
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

  return (
    <JobContext.Provider
      value={{
        jobs,
        currentIndex,
        savedJobs,
        saveJob,
        unsaveJob,
        isJobSaved,
        appliedJobs,
        applyToJob,
        isJobApplied,
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