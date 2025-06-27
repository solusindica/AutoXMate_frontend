import { Message, Contact } from '../types';
import { getAllContacts } from './contactService';
import axios from '../api/axios'

const MESSAGES_STORAGE_KEY = 'whatsapp_marketing_messages';




export const getAllMessages = async (): Promise<Message[]> => {
  const res = await axios.get('/messages');
  
  return res.data.map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));
};

export const getMessagesByContactId = async (contactId: string): Promise<Message[]> => {
  const res = await axios.get(`/messages/${contactId}`);
  
  return res.data.map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));
};


export const sendMessage = async (
  contactId: string,
  options: {
    type?: Message['type'];                  // 'text' or 'template'
    content?: string;                        // Only for text
    templateName?: string;                   // Only for template
    language?: string;                       // Optional, default 'en_US'
    components?: any[];                      // Template component array
  } = {}
): Promise<Message> => {
  const {
    type = 'text',
    content = '',
    templateName,
    language = 'en_US',
    components
  } = options;

  const payload: any = { contactId, type };

  if (type === 'text') {
    payload.content = content;
  } else if (type === 'template') {
    if (!templateName || !components) {
      throw new Error('Missing templateName or components for template message');
    }
    payload.templateName = templateName;
    payload.language = language;
    payload.components = components;
  } else {
    throw new Error(`Unsupported message type: ${type}`);
  }

  const res = await axios.post('/messages/send', payload);

  return {
    id: res.data.id || Date.now().toString(),
    contactId,
    type,
    content: type === 'text' ? content : templateName || '',
    direction: 'outbound',
    status: res.data.status || 'sent',
    timestamp: new Date(),
    templateName: templateName,
  };
};

export const getMessageStats = async (): Promise<{
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  sentToday: number;
  receivedToday: number;
}> => {
  const messages = await getAllMessages();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = {
    total: messages.length,
    sent: messages.filter(m => m.status === 'sent').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    read: messages.filter(m => m.status === 'read').length,
    failed: messages.filter(m => m.status === 'failed').length,
    sentToday: messages.filter(m => 
      m.direction === 'outbound' && m.timestamp >= today
    ).length,
    receivedToday: messages.filter(m => 
      m.direction === 'inbound' && m.timestamp >= today
    ).length,
  };
  
  return stats;
};