// Job-related type definitions

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
}

export interface Job {
  id: string;
  title: string;
  company: Company;
  location: string;
  locationType: 'Remote' | 'Hybrid' | 'Onsite';
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  postedAt: string; // ISO date string
  applicants: number;
  easyApply: boolean;
  applicationType: 'direct' | 'external'; // How to apply: direct (in-app) or external (portal)

  // Quick view info (shown on card)
  highlights: string[];
  skills: string[];
  experienceLevel: 'entry' | 'associate' | 'mid-senior' | 'director' | 'executive';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';

  // Detailed info (shown when expanded)
  description: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  aboutCompany: string;
  questions?: string[];
}

export interface EasyApplyData {
  resume: string | null;
  refinedResume?: string; // AI-tailored resume content from agent
  phone: string;
  email: string;
  coverLetter?: string;
  additionalQuestions?: {
    question: string;
    answer: string;
  }[];
  jobQuestions?: {
    question: string;
    answer: string;
  }[];
  preferences?: {
    workAuthorizationInCountry?: boolean;
    needsVisa?: boolean;
    ethnicity?: string;
    veteran?: string;
    disability?: string;
    gender?: string;
    willingToRelocate?: boolean;
  };
}

export type SwipeDirection = 'left' | 'right' | 'up' | null;