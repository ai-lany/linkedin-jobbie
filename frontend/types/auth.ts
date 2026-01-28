// Auth-related type definitions

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  resume?: string;
  workHistory?: Array<{
    company: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
  }>;
  additionalInfo?: {
    workAuthorizationInCountry?: boolean;
    needsVisa?: boolean;
    ethnicity?: string;
    veteran?: string;
    disability?: string;
    resumeTailoring?: boolean;
    autoApply?: boolean;
    gender?: string;
    willingToRelocate?: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;

  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUserPreferences: (preferences: Partial<User['additionalInfo']>) => Promise<boolean>;
  isAuthenticated: boolean;
}
