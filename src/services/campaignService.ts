// services/campaignService.ts
import { Campaign, Template } from '../types';
import axios from '../api/axios';

export const getAllTemplates = async (): Promise<Template[]> => {
  const response = await axios.get('/templates/meta');
  return response.data || [];
};

export const getTemplateById = async (id: string): Promise<Template | null> => {
  const templates = await getAllTemplates();
  return templates.find(t => t.id === id) || null;
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  const response = await axios.get('/campaigns/');
  return response.data || [];
};

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  const campaigns = await getAllCampaigns();
  return campaigns.find(c => c.id === id) || null;
};

// ✅ Updated function to match enhanced frontend logic
export const createCampaign = async (campaignData: {
  name: string;
  description?: string;
  templateId: string;
  templateName: string;
  language: string;
  components: any[]; // body, header, buttons included
  contactIds: string[];
  scheduledAt?: Date;
  createdBy: string;
}): Promise<Campaign> => {
  const payload = {
    name: campaignData.name,
    description: campaignData.description,
    template_id: campaignData.templateId,
    template_name: campaignData.templateName,
    language: campaignData.language,
    components: campaignData.components,
    contact_ids: campaignData.contactIds,
    scheduled_at: campaignData.scheduledAt,
    created_by: campaignData.createdBy,
  };

  console.log("📤 Payload to backend:", payload);
  const response = await axios.post('/campaigns/', payload);
  return response.data;
};

<<<<<<< HEAD
export const runCampaign = async (data: {
  template_name: string;
  language: string;
  components: any[];
  contact_ids: string[];
}): Promise<void> => {
  await axios.post('/campaigns/run', data);
=======
export const runCampaign = async (
  campaignId: string,
  data: {
    template_name: string;
    language: string;
    components: any[];
    contact_ids: string[];
  }
): Promise<void> => {
  await axios.post(`https://autoxmate-backend.onrender.com/campaigns/${campaignId}/run`, data);
>>>>>>> 6a656d9a7e56a34a8ec0f138cd499155703e6ab7
};

export const deleteCampaign = async (id: string): Promise<void> => {
  await axios.delete(`/campaigns/${id}`);
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
