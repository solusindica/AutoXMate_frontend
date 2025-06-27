import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Campaign, Template, Contact } from '../types';
import * as campaignService from '../services/campaignService';
import * as contactService from '../services/contactService';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Play, Pause, Trash2, Users, MessageSquare, Calendar, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as templateService from '../services/templateService';
import * as messageService from '../services/messageService';

interface CampaignForm {
  name: string;
  description: string;
  templateId: string;
  contactIds: string[];
  scheduledAt?: string;
}

export const CampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CampaignForm>();
  const watchedTemplateId = watch('templateId');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (watchedTemplateId) {
      const template = templates.find(t => t.id === watchedTemplateId);
      setSelectedTemplate(template || null);
    }
  }, [watchedTemplateId, templates]);

  const fetchData = async () => {
    try {
      const [campaignsData, templatesData, contactsData] = await Promise.all([
        campaignService.getAllCampaigns(),
        templateService.getAllTemplates(),
        contactService.getAllContacts()
      ]);
      setCampaigns(campaignsData);
      setTemplates(templatesData);
      setContacts(contactsData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (data: CampaignForm) => {
    if (!user) return;
    const template = templates.find(t => t.id === data.templateId);

    try {
      const newCampaign = await campaignService.createCampaign({
        name: data.name,
        description: data.description,
        templateId: data.templateId,
        contactIds: data.contactIds,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        createdBy: user.id,
        templateName: template?.name,
        components: template?.components
      });
      setCampaigns(prev => [newCampaign, ...prev]);
      setIsCreateModalOpen(false);
      reset();
      toast.success('Campaign created successfully');
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  const handleRunCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Are you sure you want to run "${campaign.name}"?`)) return;

    try {
      const template = templates.find(t => t.id === campaign.templateId);
      if (!template) {
        toast.error('Template not found');
        return;
      }

      for (const contactId of campaign.contactIds) {
        try {
          await messageService.sendMessage(contactId, {
            type: 'template',
            templateName: template.name,
            language: template.language || 'en_US',
            components: template.components
          });
        } catch (error) {
          console.error(`Failed to send to contact ${contactId}:`, error);
        }
      }

      toast.success('Campaign sent successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send campaign');
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Are you sure you want to delete "${campaign.name}"?`)) return;

    try {
      await campaignService.deleteCampaign(campaign.id);
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      toast.success('Campaign deleted successfully');
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'scheduled': return 'info';
      case 'running': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'completed': return <BarChart className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
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
      <Header 
        title="Campaigns" 
        subtitle="Manage your marketing campaigns"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto p-6">
        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Play className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'running' || c.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reached</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + c.stats.sent, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-4">Create your first marketing campaign to get started</p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <Badge variant={getStatusColor(campaign.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(campaign.status)}
                          {campaign.status}
                        </div>
                      </Badge>
                    </div>
                    
                    {campaign.description && (
                      <p className="text-gray-600 mb-3">{campaign.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {campaign.templateName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.contactIds.length} contacts
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(campaign.createdAt, 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    {/* Campaign Stats */}
                    {campaign.stats.total > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold">{campaign.stats.total}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Sent</p>
                          <p className="font-semibold text-blue-600">{campaign.stats.sent}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivered</p>
                          <p className="font-semibold text-green-600">{campaign.stats.delivered}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Read</p>
                          <p className="font-semibold text-purple-600">{campaign.stats.read}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-6">
                    {campaign.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleRunCampaign(campaign)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteCampaign(campaign)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Campaign"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateCampaign)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                {...register('name', { required: 'Campaign name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter campaign name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule (Optional)
              </label>
              <input
                {...register('scheduledAt')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your campaign..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Template *
            </label>
            <select
              {...register('templateId', { required: 'Template is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
            {errors.templateId && (
              <p className="text-red-500 text-sm mt-1">{errors.templateId.message}</p>
            )}
            
            {selectedTemplate && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Template Preview:</p>
                <p className="text-sm text-gray-600">{selectedTemplate.content}</p>
                {selectedTemplate?.variables?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Variables: {selectedTemplate.variables.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Contacts *
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {contacts.map((contact) => (
                <label key={contact.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    value={contact.id}
                    {...register('contactIds', { required: 'At least one contact must be selected' })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.contactIds && (
              <p className="text-red-500 text-sm mt-1">{errors.contactIds.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" className="flex-1">
              Create Campaign
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};