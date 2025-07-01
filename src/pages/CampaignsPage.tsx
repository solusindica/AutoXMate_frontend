import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Campaign, Template, Contact } from '../types';
import * as campaignService from '../services/campaignService';
import * as contactService from '../services/contactService';
import * as templateService from '../services/templateService';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';

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
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CampaignForm>();
  const watchedTemplateId = watch('templateId');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const selected = templates.find(t => t.id === watchedTemplateId);
    setSelectedTemplate(selected || null);

    if (selected?.content) {
      const matches = [...selected.content.matchAll(/\{\{(.*?)\}\}/g)];
      const vars = Object.fromEntries(matches.map(m => [m[1], '']));
      setTemplateVariables(vars);
    } else {
      setTemplateVariables({});
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
        components: template?.components || [],
      });
      setCampaigns(prev => [newCampaign, ...prev]);
      setIsCreateModalOpen(false);
      reset();
      setTemplateVariables({});
      toast.success('Campaign created successfully');
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  const handleRunCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Are you sure you want to run "${campaign.name}"?`)) return;

    try {
      await axios.post('/campaigns/run', {
        templateName: campaign.templateName,
        contactIds: campaign.contactIds,
        variables: templateVariables
      });

      toast.success('Campaign sent successfully');
    } catch (error) {
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
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-gray-600">{campaign.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{campaign.templateName}</span>
                    <span>{campaign.contactIds.length} contacts</span>
                    <span>{format(new Date(campaign.createdAt), 'PP')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <Button size="sm" onClick={() => handleRunCampaign(campaign)}>
                      <Play className="w-4 h-4 mr-1" />
                      Run
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDeleteCampaign(campaign)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTemplateVariables({});
        }}
        title="Create New Campaign"
      >
        <form onSubmit={handleSubmit(handleCreateCampaign)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Name *</label>
            <input
              {...register('name', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Enter name"
            />
            {errors.name && <p className="text-red-500 text-sm">Campaign name is required</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Select Template *</label>
            <select
              {...register('templateId', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">-- Select Template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
            {errors.templateId && <p className="text-red-500 text-sm">Template is required</p>}
          </div>

          {Object.keys(templateVariables).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(templateVariables).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setTemplateVariables(prev => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder={`Enter ${key}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Contacts *</label>
            <div className="border border-gray-300 rounded p-2 max-h-48 overflow-y-auto">
              {contacts.map(c => (
                <label key={c.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    value={c.id}
                    {...register('contactIds', { required: true })}
                    className="accent-blue-500"
                  />
                  <span>{c.name} ({c.phone})</span>
                </label>
              ))}
            </div>
            {errors.contactIds && <p className="text-red-500 text-sm">At least one contact required</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};