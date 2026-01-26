// Job-related type definitions

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  size: string; // e.g., "1,001-5,000 employees"
  location: string;
}

export interface Job {
  id: string;
  title: string;
  company: Company;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };
  postedAt: string; // ISO date string
  applicants: number;
  easyApply: boolean;

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
}

export interface EasyApplyData {
  resume: string | null;
  phone: string;
  email: string;
  additionalQuestions?: {
    question: string;
    answer: string;
  }[];
  coverLetter?: string;
}

export type SwipeDirection = 'left' | 'right' | 'up' | null;