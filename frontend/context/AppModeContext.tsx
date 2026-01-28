import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Job } from '../types/job';

type AppMode = 'linkedin' | 'jobbie';

interface AppModeContextType {
  mode: AppMode;
  selectedJob: Job | null;
  switchToJobbie: (job: Job) => void;
  switchToLinkedIn: () => void;
  clearSelectedJob: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('jobbie');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const switchToJobbie = (job: Job) => {
    setSelectedJob(job);
    setMode('jobbie');
  };

  const switchToLinkedIn = () => {
    setMode('linkedin');
  };

  const clearSelectedJob = () => {
    setSelectedJob(null);
  };

  return (
    <AppModeContext.Provider
      value={{
        mode,
        selectedJob,
        switchToJobbie,
        switchToLinkedIn,
        clearSelectedJob,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}
