import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Conversation, Message, Contact } from '../types';
import * as conversationService from '../services/conversationService';
import * as messageService from '../services/messageService';
import { Search, Send, Phone, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export const ConversationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedContactIdFromQuery = searchParams.get('contactId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations(selectedContactIdFromQuery || undefined);
  }, []);

  useEffect(() => {
  if (!selectedConversation) return;
  const interval = setInterval(() => {
    fetchMessages(selectedConversation.contactId);
  }, 5000);
  return () => clearInterval(interval);
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.contactId);
      conversationService.markConversationAsRead(selectedConversation.contactId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (contactIdToSelect?: string) => {
  try {
    const data = await conversationService.getAllConversations();
    const parsed = data.map((conv) => ({
      ...conv,
      updatedAt: new Date(conv.updatedAt),
      lastMessage: {
        ...conv.lastMessage,
        timestamp: new Date(conv.lastMessage.timestamp),
      },
    }));
    setConversations(parsed);
    console.log("Fetched conversations:", parsed);

    if (contactIdToSelect) {
      const match = parsed.find((c) => c.contactId === contactIdToSelect);
      if (match) {
        setSelectedConversation(match);
      } else {
        const contact = await conversationService.getContactById(contactIdToSelect);
        if (contact) {
          const newConv: Conversation = {
          id: `conv_${contact.id}`,
          contactId: contact.id,
          contact,
          lastMessage: {
            id: 'temp-id',
            contactId: contact.id,
            content: 'Start your conversation...',
            timestamp: new Date(),
            status: 'pending',
            direction: 'outbound',
            type: 'text', // Add this only if your Message type includes it
          },
          unreadCount: 0,
          status: 'active',
          updatedAt: new Date(),
        };

          setSelectedConversation(newConv);
        }
      }
    } else if (parsed.length > 0 && !selectedConversation) {
      setSelectedConversation(parsed[0]);
    }
  } catch (error) {
    toast.error('Failed to fetch conversations');
  } finally {
    setLoading(false);
  }
};

const fetchMessages = async (contactId: string) => {
  try {
    const data = await messageService.getMessagesByContactId(contactId);
    const parsed = data.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
    setMessages(parsed);
  } catch (error) {
    toast.error('Failed to fetch messages');
  }
};

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const sentMessage = await messageService.sendMessage(
        selectedConversation.contactId,
        messageContent
      );

      setMessages(prev => [...prev, { ...sentMessage, timestamp: new Date(sentMessage.timestamp) }]);
      fetchConversations();
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'sent': return 'text-gray-400';
      case 'delivered': return 'text-blue-500';
      case 'read': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getMessageStatusText = (status: Message['status']) => {
    switch (status) {
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      case 'failed': return 'Failed';
      case 'pending': return 'Sending...';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Conversations" subtitle="Manage your WhatsApp conversations" />

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={clsx(
                    'p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
                    selectedConversation?.id === conversation.id && 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.contact.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.contact.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {format(new Date(conversation.updatedAt), 'HH:mm')}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-1">
                        {conversation.lastMessage.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {conversation.contact.phone}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="info" size="sm">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.contact.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.contact.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={clsx(
                    'flex',
                    message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                      message.direction === 'outbound'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <span className="text-xs opacity-70">
                        {format(message.timestamp, 'HH:mm')}
                      </span>
                      {message.direction === 'outbound' && (
                        <span className={clsx('text-xs', getMessageStatusColor(message.status))}>
                          {getMessageStatusText(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <button
                      type="button"
                      className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-3 border-0 focus:ring-0 resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />

                    <button
                      type="button"
                      className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendingMessage}
                  loading={sendingMessage}
                  size="lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
