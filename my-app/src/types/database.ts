// User role types
export type UserRole = 'admin' | 'user';

// Bedrift (Business) - inneholder bedriftsinformasjon og chatWidget config
export interface Business {
  id: string;
  name: string;
  email: string;
  ownerId: string;
  chatWidgetKey: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Chat Widget spesifikt
  chatWidgetConfig?: ChatWidgetConfig;
  chatAssistantConfig?: ChatAssistantConfig;
  chatAnalytics?: ChatAnalytics;
}

export interface ChatAssistantConfig {
  enabled: boolean;
  provider: 'gemini';
  model: string;
  strictContextOnly: boolean;
  systemPrompt: string;
  businessContext: string;
  restrictions: string;
  supportTriggerKeywords: string[];
  handoffMessage: string;
}

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  aiOnlySessions: number;
  supportRequests: number;
  savedSupportChats: number;
  lastChatAt?: Date;
}

export interface SupportChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: Date;
}

export interface SupportChatSession {
  id: string;
  businessId: string;
  widgetKey: string;
  sessionId: string;
  status: 'needs-human' | 'open' | 'closed';
  source: 'widget';
  preview: string;
  pageTitle?: string;
  pageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  supportRequestedAt?: Date;
  messageCount: number;
  messages: SupportChatMessage[];
}

// Chat Widget config
export interface ChatWidgetConfig {
  // Plan and billing
  plan: 'free' | 'pro' | 'business';
  billingCycle: 'monthly' | 'yearly';
  
  // Color theme (only this affects colors)
  colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury';
  
  // Position (affects widget placement)
  position: 'bottom-right' | 'bottom-left';
  
  // Design options (affects shapes, shadows, borders, elements)
  bubbleStyle: {
    showStatus: boolean;
    iconChoice: 'chat' | 'phone' | 'cpu' | 'message' | 'support';
    borderType: 'none' | 'solid' | 'rounded' | 'shadow';
    shadowType: 'none' | 'light' | 'medium' | 'heavy';
    animationType: 'none' | 'bounce' | 'fade' | 'slide';
    sizeType: 'small' | 'medium' | 'large';
  };
  
  headerStyle: {
    showStatus: boolean;
    showCloseButton: boolean;
    borderType: 'none' | 'solid' | 'rounded' | 'shadow';
    shadowType: 'none' | 'light' | 'medium' | 'heavy';
    showAvatar: boolean;
    showTitle: boolean;
  };
  
  bodyStyle: {
    borderType: 'none' | 'solid' | 'rounded' | 'shadow';
    shadowType: 'none' | 'light' | 'medium' | 'heavy';
    messageStyle: 'bubble' | 'flat' | 'card';
    showTimestamps: boolean;
    showReadReceipts: boolean;
  };
  
  footerStyle: {
    showSendButton: boolean;
    borderType: 'none' | 'solid' | 'rounded' | 'shadow';
    shadowType: 'none' | 'light' | 'medium' | 'heavy';
    inputStyle: 'flat' | 'rounded' | 'outlined';
    showPlaceholder: boolean;
  };
  
  // Custom branding
  customBranding: {
    title?: string;
    description?: string;
    logo?: string;
  };
  
  // Advanced settings
  settings: {
    autoOpen: boolean;
    delayMs: number;
  };
}

// User - under businesses/{id}/users/{userId}
export interface BusinessUser {
  id: string; // Firebase UID
  email: string;
  displayName?: string;
  photoURL?: string;
  businessId: string; // 🔥 viktig for auth context
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

// Pending user - før accept invite
export interface PendingUser {
  id: string; // Firebase UID
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Auth response type
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: BusinessUser;
  redirectTo?: string;
}

// Invitation - under businesses/{id}/invitations/{id}
export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  createdBy: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

// Pending auth - midlertidig token for email verification
export interface PendingAuth {
  id: string; // Firebase UID
  email: string;
  displayName?: string;
  token: string;
  createdAt: Date;
}
