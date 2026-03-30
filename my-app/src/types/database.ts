// User role types
export type UserRole = 'admin' | 'user';

// Bedrift (Business) - inneholder bedriftsinformasjon og chatWidget config
export interface Business {
  id: string;
  businessName: string;
  adminEmail: string;
  users: string[]; // Array av userId som har tilgang til bedriften
  createdAt: Date;
  updatedAt: Date;
  
  // Chat Widget spesifikt
  chatWidgetKey: string; // Randomly generated key
  chatWidgetConfig?: ChatWidgetConfig;
}

// Chat Widget config
export interface ChatWidgetConfig {
  designLevel: 'standard' | 'premium' | 'elite';
  colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  customBranding?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  settings?: {
    autoOpen?: boolean;
    delayMs?: number;
    [key: string]: any;
  };
}

// User - minimal brukerinfo (referanse til bedrift)
export interface User {
  id: string; // Firebase UID
  email: string;
  businessId: string; // Referanse til Business
  role: UserRole; // 'admin' eller 'user' innen bedriften
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  
  // Email verification
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  
  // Password reset
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
}

// Auth response type
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  redirectTo?: string;
}

// Invitation (for å invatera nye brukere)
export interface Invitation {
  id: string;
  businessId: string;
  businessName: string;
  inviteEmail: string;
  inviteRole: UserRole;
  createdBy: string; // Admin som opprettet invitasjonen
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
}
