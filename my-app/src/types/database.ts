// User role types
export type UserRole = 'admin' | 'manager' | 'support' | 'viewer' | 'user';

// Bedrift (Business) - inneholder bedriftsinformasjon og chatWidget config
export interface Business {
  id: string;
  name: string;
  email: string;
  ownerId: string;
  chatWidgetKey: string;
  activeChatWidgetKey?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Chat Widget spesifikt
  chatWidgetConfig?: ChatWidgetConfig;
  chatWidgets?: ChatWidgetRecord[];
  chatAssistantConfig?: ChatAssistantConfig;
  chatAnalytics?: ChatAnalytics;
  supportTaskCategories?: SupportTaskCategory[];
  onboarding?: BusinessOnboardingState;
}

export interface BusinessOnboardingState {
  tutorialCompletedAt?: Date | null;
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
  faqSuggestionsEnabled: boolean;
  faqSuggestions: string[];
  startLanguage: string;
  replyInUserLanguage: boolean;
  responseStyle: string;
  extraInstructions: string;
  forceSelectedModelOnly: boolean;
}

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  aiOnlySessions: number;
  supportRequests: number;
  savedSupportChats: number;
  dailyConversationCounts?: Record<string, number>;
  countryCounts?: Record<string, number>;
  modelUsage?: Record<string, number>;
  timeline?: ChatAnalyticsEvent[];
  lastChatAt?: Date;
}

export type BubbleIconChoice = 'chat' | 'phone' | 'cpu' | 'message' | 'support' | 'orb';
export interface OrbStyleConfig {
  hoverEnabled: boolean;
  hoverGlyph: string;
  replyEnabled: boolean;
  replyGlyphs: string;
  inactiveEnabled: boolean;
  inactiveGlyphs: string;
  inactivityMinMinutes: number;
  inactivityMaxMinutes: number;
}

export interface ChatAnalyticsEvent {
  id: string;
  kind:
    | 'session-start'
    | 'visitor-message'
    | 'assistant-reply'
    | 'support-request'
    | 'support-message'
    | 'support-open'
    | 'support-returned';
  sessionId: string;
  countryCode?: string;
  createdAt: Date;
}

export interface SupportChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'support' | 'system';
  text: string;
  createdAt: Date;
}

export interface SupportChatSession {
  id: string;
  businessId: string;
  widgetKey: string;
  sessionId: string;
  status: 'needs-human' | 'open' | 'ai-active' | 'closed';
  source: 'widget';
  preview: string;
  pageTitle?: string;
  pageUrl?: string;
  visitorName?: string;
  countryCode?: string;
  createdAt: Date;
  updatedAt: Date;
  supportRequestedAt?: Date;
  messageCount: number;
  messages: SupportChatMessage[];
}

export type SupportTaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type SupportTaskStatus = 'open' | 'in-progress' | 'blocked' | 'done';

export interface SupportTaskComment {
  id: string;
  text: string;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
}

export interface SupportTaskCategory {
  id: string;
  name: string;
  default: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTask {
  id: string;
  businessId: string;
  chatId?: string;
  sessionId?: string;
  visitorName?: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  priority: SupportTaskPriority;
  status: SupportTaskStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  chatMessages?: SupportChatMessage[];
  chatPreview?: string;
  chatPageTitle?: string;
  chatPageUrl?: string;
  chatCountryCode?: string;
  comments?: SupportTaskComment[];
}

export interface BusinessFeedback {
  id: string;
  businessId: string;
  sessionId?: string;
  widgetKey?: string;
  visitorName?: string;
  rating: number;
  text: string;
  pageTitle?: string;
  pageUrl?: string;
  countryCode?: string;
  source: 'widget';
  createdAt: Date;
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
    iconChoice: BubbleIconChoice;
    borderType: 'none' | 'solid' | 'rounded' | 'shadow';
    shadowType: 'none' | 'light' | 'medium' | 'heavy';
    animationType: 'none' | 'bounce' | 'fade' | 'slide';
    sizeType: 'small' | 'medium' | 'large';
    orbStyle?: OrbStyleConfig;
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
    logoStyle?: {
      zoom: number;
      focusX: number;
      focusY: number;
    };
  };
  
  // Advanced settings
  settings: {
    autoOpen: boolean;
    delayMs: number;
  };

  // Security settings
  allowedDomains: string[];
}

export interface ChatWidgetRecord {
  id: string;
  widgetKey: string;
  name: string;
  config: ChatWidgetConfig;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface BusinessInvitation extends Invitation {
  businessId: string;
  businessName?: string;
}

// Pending auth - midlertidig token for email verification
export interface PendingAuth {
  id: string; // Firebase UID
  email: string;
  displayName?: string;
  token: string;
  createdAt: Date;
}
