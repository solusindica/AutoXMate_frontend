import { Campaign, Template, Contact, Message } from '../types';
import { getAllContacts } from './contactService';
import { sendMessage } from './messageService';

const CAMPAIGNS_STORAGE_KEY = 'whatsapp_marketing_campaigns';
const TEMPLATES_STORAGE_KEY = 'whatsapp_marketing_templates';

// Mock templates
const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Welcome Message',
    category: 'onboarding',
    language: 'en',
    content: 'Welcome {{name}}! We\'re excited to have you join our community.',
    variables: ['name'],
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Promotional Offer',
    category: 'marketing',
    language: 'en',
    content: 'Hi {{name}}, exclusive offer just for you! Get {{discount}}% off until {{date}}.',
    variables: ['name', 'discount', 'date'],
    status: 'active',
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '3',
    name: 'Order Confirmation',
    category: 'transactional',
    language: 'en',
    content: 'Thank you {{name}}! Your order #{{order_id}} has been confirmed.',
    variables: ['name', 'order_id'],
    status: 'active',
    createdAt: new Date('2024-01-10'),
  },
];

// Mock campaigns
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'New Year Promotion',
    description: 'Special discount campaign for new year',
    templateId: '2',
    templateName: 'Promotional Offer',
    templateContent: 'Hi {{name}}, exclusive offer just for you! Get {{discount}}% off until {{date}}.',
    contactIds: ['1', '2'],
    status: 'completed',
    scheduledAt: new Date('2024-01-15T09:00:00'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    createdBy: '1',
    stats: {
      total: 2,
      sent: 2,
      delivered: 2,
      read: 1,
      failed: 0,
    },
  },
  {
    id: '2',
    name: 'Welcome Series',
    description: 'Welcome new customers',
    templateId: '1',
    templateName: 'Welcome Message',
    templateContent: 'Welcome {{name}}! We\'re excited to have you join our community.',
    contactIds: ['3'],
    status: 'running',
    scheduledAt: new Date(),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
    createdBy: '1',
    stats: {
      total: 1,
      sent: 1,
      delivered: 0,
      read: 0,
      failed: 0,
    },
  },
];

const initializeTemplates = (): Template[] => {
  const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(MOCK_TEMPLATES));
    return MOCK_TEMPLATES;
  }
  return JSON.parse(stored).map((template: any) => ({
    ...template,
    createdAt: new Date(template.createdAt)
  }));
};

const initializeCampaigns = (): Campaign[] => {
  const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(MOCK_CAMPAIGNS));
    return MOCK_CAMPAIGNS;
  }
  return JSON.parse(stored).map((campaign: any) => ({
    ...campaign,
    createdAt: new Date(campaign.createdAt),
    updatedAt: new Date(campaign.updatedAt),
    scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt) : undefined,
  }));
};

export const getAllTemplates = async (): Promise<Template[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return initializeTemplates();
};

export const getTemplateById = async (id: string): Promise<Template | null> => {
  const templates = await getAllTemplates();
  return templates.find(t => t.id === id) || null;
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return initializeCampaigns();
};

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  const campaigns = await getAllCampaigns();
  return campaigns.find(c => c.id === id) || null;
};

export const createCampaign = async (campaignData: {
  name: string;
  description?: string;
  templateId: string;
  contactIds: string[];
  scheduledAt?: Date;
  createdBy: string;
}): Promise<Campaign> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const template = await getTemplateById(campaignData.templateId);
  if (!template) {
    throw new Error('Template not found');
  }
  
  const campaigns = await getAllCampaigns();
  const newCampaign: Campaign = {
    id: Date.now().toString(),
    name: campaignData.name,
    description: campaignData.description,
    templateId: campaignData.templateId,
    templateName: template.name,
    templateContent: template.content,
    contactIds: campaignData.contactIds,
    status: campaignData.scheduledAt && campaignData.scheduledAt > new Date() ? 'scheduled' : 'draft',
    scheduledAt: campaignData.scheduledAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: campaignData.createdBy,
    stats: {
      total: campaignData.contactIds.length,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    },
  };
  
  campaigns.push(newCampaign);
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  
  return newCampaign;
};

export const runCampaign = async (campaignId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const campaigns = await getAllCampaigns();
  const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
  
  if (campaignIndex === -1) {
    throw new Error('Campaign not found');
  }
  
  const campaign = campaigns[campaignIndex];
  const contacts = await getAllContacts();
  
  // Update campaign status
  campaigns[campaignIndex].status = 'running';
  campaigns[campaignIndex].updatedAt = new Date();
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  
  // Send messages to all contacts
  let sentCount = 0;
  for (const contactId of campaign.contactIds) {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      try {
        // Replace template variables with contact data
        let message = campaign.templateContent;
        message = message.replace(/\{\{name\}\}/g, contact.name);
        message = message.replace(/\{\{discount\}\}/g, '20');
        message = message.replace(/\{\{date\}\}/g, '31st Dec');
        message = message.replace(/\{\{order_id\}\}/g, Math.random().toString(36).substr(2, 9).toUpperCase());
        
        await sendMessage(contactId, message, 'template', campaign.templateName);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send message to contact ${contactId}:`, error);
      }
    }
  }
  
  // Update campaign stats
  campaigns[campaignIndex].stats.sent = sentCount;
  campaigns[campaignIndex].status = 'completed';
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
};

export const deleteCampaign = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const campaigns = await getAllCampaigns();
  const filteredCampaigns = campaigns.filter(c => c.id !== id);
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(filteredCampaigns));
};

export const getCampaignStats = async (): Promise<{
  total: number;
  active: number;
  completed: number;
  thisMonth: number;
}> => {
  const campaigns = await getAllCampaigns();
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  return {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'running' || c.status === 'scheduled').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    thisMonth: campaigns.filter(c => c.createdAt >= thisMonth).length,
  };
};