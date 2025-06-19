import { Conversation } from '../types';
import axios from '../api/axios';
import { Contact } from '../types';

// GET all conversations




export const getAllConversations = async (): Promise<Conversation[]> => {
  const response = await axios.get('/conversations');

  return response.data.map((conv: any) => ({
    ...conv,
    updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
    lastMessage: {
      ...conv.lastMessage,
      timestamp: conv.lastMessage?.timestamp ? new Date(conv.lastMessage.timestamp) : new Date(),
    },
  }));
};



// GET a single conversation by contactId

export const getContactById = async (contactId: string): Promise<Contact | null> => {
  try {
    const response = await axios.get(`http://localhost:8000/contacts/${contactId}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch contact", err);
    return null;
  }
};

// POST to mark a conversation as read
export const markConversationAsRead = async (contactId: string): Promise<void> => {
  try {
    await axios.post(`/conversations/${contactId}/mark-read`);
  } catch (error) {
    console.error('Failed to mark conversation as read:', error);
  }
};
