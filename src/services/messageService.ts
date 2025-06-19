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
  content: string,
  type: Message['type'] = 'text'
): Promise<Message> => {
  const res = await axios.post('/messages/send', {
    contactId,
    content,
    type,
  });

  return {
    id: res.data.id || Date.now().toString(),
    contactId,
    type,
    content,
    direction: 'outbound',
    status: res.data.status || 'sent',
    timestamp: new Date(),
  };
};

export const updateMessageStatus = async (messageId: string, status: Message['status']): Promise<void> => {
  const messages = await getAllMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex !== -1) {
    messages[messageIndex].status = status;
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }
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