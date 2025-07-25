import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status?: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  customFields?: Record<string, any>;
}

export interface Message {
  id: string;
  contactId: string;
  campaignId?: string;
  type: 'text' | 'template' | 'media' | 'document';
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  timestamp: Date | string;  
  templateName?: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  template_name?: string;
  contact_ids: string[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  language :string;
  components?: any[]; 
  
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  run_payload?: {
    template_name: string;
    language: string;
    contact_ids: string[];
    components: any[];
  };
}


export interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  content: string;
  variables: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  components?: any[]; // ✅ Add this line
  
}

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookUrl?: string;
  webhookToken?: string;
  isConfigured: boolean;
}

export interface DashboardStats {
  totalContacts: number;
  totalMessages: number;
  totalCampaigns: number;
  activeConversations: number;
  messagesSentToday: number;
  messagesReceivedToday: number;
  campaignsThisMonth: number;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
}

export interface Conversation {
  id: string;
  contactId: string;
  contact: Contact;
  lastMessage: Message;
  unreadCount: number;
  status: string;
  updatedAt: Date;
}