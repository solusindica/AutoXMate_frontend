import { WhatsAppConfig } from '../types';

const WHATSAPP_CONFIG_KEY = 'whatsapp_config';

export const getWhatsAppConfig = async (): Promise<WhatsAppConfig> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const stored = localStorage.getItem(WHATSAPP_CONFIG_KEY);
  if (!stored) {
    return {
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      webhookUrl: '',
      webhookToken: '',
      isConfigured: false,
    };
  }
  
  return JSON.parse(stored);
};

export const updateWhatsAppConfig = async (config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const currentConfig = await getWhatsAppConfig();
  const updatedConfig = { 
    ...currentConfig, 
    ...config,
    isConfigured: !!(config.accessToken && config.phoneNumberId && config.businessAccountId)
  };
  
  localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(updatedConfig));
  return updatedConfig;
};

export const testWhatsAppConnection = async (): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const config = await getWhatsAppConfig();
  if (!config.isConfigured) {
    throw new Error('WhatsApp API is not configured');
  }
  
  // Simulate API test
  const success = Math.random() > 0.2; // 80% success rate for demo
  if (!success) {
    throw new Error('Failed to connect to WhatsApp API. Please check your credentials.');
  }
  
  return true;
};

export const fetchWhatsAppBusinessInfo = async (): Promise<{
  name: string;
  profilePictureUrl?: string;
  status: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    name: 'Your Business Name',
    profilePictureUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'Connected',
  };
};