import { DashboardStats } from '../types';
import { getAllContacts } from './contactService';
import { getMessageStats } from './messageService';
import { getCampaignStats } from './campaignService';
import { getAllConversations } from './conversationService';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [contacts, messageStats, campaignStats, conversations] = await Promise.all([
    getAllContacts(),
    getMessageStats(),
    getCampaignStats(),
    getAllConversations()
  ]);
  
  const deliveryRate = messageStats.sent > 0 
    ? Math.round((messageStats.delivered / messageStats.sent) * 100)
    : 0;
  
  const openRate = messageStats.delivered > 0
    ? Math.round((messageStats.read / messageStats.delivered) * 100)
    : 0;
  
  const responseRate = messageStats.sentToday > 0
    ? Math.round((messageStats.receivedToday / messageStats.sentToday) * 100)
    : 0;
  
  return {
    totalContacts: contacts.length,
    totalMessages: messageStats.total,
    totalCampaigns: campaignStats.total,
    activeConversations: conversations.filter(c => c.unreadCount > 0).length,
    messagesSentToday: messageStats.sentToday,
    messagesReceivedToday: messageStats.receivedToday,
    campaignsThisMonth: campaignStats.thisMonth,
    deliveryRate,
    openRate,
    responseRate,
  };
};