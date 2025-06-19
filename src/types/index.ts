import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  timestamp: Date;
  templateName?: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  templateName: string;
  templateContent: string;
  contactIds: string[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
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
