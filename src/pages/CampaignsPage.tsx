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
import { supabase } from '../lib/supabaseClient'

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
  const [isImageHeader, setIsImageHeader] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [buttonsInfo, setButtonsInfo] = useState<any[]>([]);
  const watchedTemplateId = watch('templateId');


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  const selected = templates.find(t => t.id === watchedTemplateId);
  setSelectedTemplate(selected || null);

  if (!selected) return;

  // BODY variables from template text like {{1}}, {{2}}, etc
  const bodyComponent = selected?.components?.find(c => c.type === 'BODY');
  if (bodyComponent?.text) {
    const matches = [...bodyComponent.text.matchAll(/{{\d+}}/g)];
    const placeholderCount = matches.length;

    const vars: Record<string, string> = {};
    for (let i = 0; i < placeholderCount; i++) {
      vars[`{{${i + 1}}}`] = '';
    }
    setTemplateVariables(vars);
  } else {
    setTemplateVariables({});
  }

  // Detect if HEADER is an image
  const headerComponent = selected?.components?.find(c => c.type === 'HEADER' && c.format === 'IMAGE');
  setIsImageHeader(!!headerComponent);

  // Collect BUTTONS
  const buttonsComponent = selected?.components?.find(c => c.type === 'BUTTONS');
  setButtonsInfo(buttonsComponent?.buttons || []);
}, [watchedTemplateId, templates]);


const fetchData = async () => {
  try {
    const [campaignsData, templatesData, contactsData] = await Promise.all([
      campaignService.getAllCampaigns(),
      templateService.getAllTemplates(),
      contactService.getAllContacts()
    ]);

    console.log("📦 Campaigns from backend:", campaignsData);
    setCampaigns(campaignsData); // ✅ may crash if campaignsData is undefined
    setTemplates(templatesData);
    setContacts(contactsData);
  } catch (error) {
    toast.error("❌ Failed to fetch campaigns");
    console.error("Fetch data error:", error);
  } finally {
    setLoading(false); // ✅ must be in finally to exit spinner
  }
};
  // ...imports remain same
const handleCreateCampaign = async (data: CampaignForm) => {
  if (!user) return;

  const template = templates.find(t => t.id === data.templateId);
  if (!template) {
    toast.error('Selected template not found');
    return;
  }

  try {
    const components: any[] = [];

    // ✅ HEADER: Upload image to Supabase (if template uses an image)
    const header = template.components?.find(c => c.type === 'HEADER');
    if (header?.format === 'IMAGE' && uploadedImage) {
      const fileExt = uploadedImage.name.split('.').pop();
      const filePath = `campaign-images/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('whatsapp-media')
        .upload(filePath, uploadedImage, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        toast.error('Image upload failed');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(filePath);

      components.push({
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: {
              link: publicUrlData.publicUrl,
            },
          },
        ],
      });
    }

    // ✅ BODY: Add text variables
    const bodyComponent = template.components?.find(c => c.type === 'BODY');
    if (bodyComponent) {
      const bodyParams = Object.values(templateVariables).map(val => ({
        type: 'text',
        text: val,
      }));
      components.push({
        type: 'body',
        parameters: bodyParams,
      });
    }

    // ✅ BUTTONS: Handle both URL and QUICK_REPLY correctly
 // ✅ BUTTONS (fix: handle URL, QUICK_REPLY, PHONE_NUMBER correctly)
  const buttons = template.components?.find(c => c.type === 'BUTTONS');
  if (buttons?.buttons?.length > 0) {
    (buttons.buttons as any[]).forEach((btn: any, idx: number) => {
      const btnType = btn.type?.toUpperCase(); // "URL" | "QUICK_REPLY" | "PHONE_NUMBER"
  
      const component: any = {
        type: 'button',
        sub_type:
          btnType === 'URL'
            ? 'url'
            : btnType === 'PHONE_NUMBER'
            ? 'phone_number'
            : 'quick_reply',
        index: idx,
        parameters: [],
      };
  
      if (btnType === 'QUICK_REPLY') {
        component.parameters = [{
          type: 'payload',
          payload: btn.text || `reply_${idx}`,
        }];
      }
  
      if (btnType === 'PHONE_NUMBER') {
        component.parameters = [{
          type: 'payload',
          payload: btn.phone_number || btn.text || `phone_${idx}`,
        }];
      }
  
      components.push(component);
    });
  }


    // ✅ Create campaign with correct run_payload
    const newCampaign = await campaignService.createCampaign({
      name: data.name,
      description: data.description,
      templateId: template.id,
      templateName: template.name,
      language: template.language,
      components,
      contactIds: data.contactIds,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      createdBy: user.id,
    });

    setCampaigns(prev => [newCampaign, ...prev]);
    setIsCreateModalOpen(false);
    reset();
    toast.success('Campaign created successfully');
  } catch (error) {
    toast.error('Failed to create campaign');
    console.error(error);
  }
};



const handleRunCampaign = async (campaign: Campaign) => {
  if (!window.confirm(`Are you sure you want to run "${campaign.name}"?`)) return;

  const payload = campaign.run_payload; // ✅ use saved payload
  if (!payload) {
    toast.error("No run payload found in this campaign");
    return;
  }

  console.log("📤 Sending campaign run payload:", payload);

  try {
    await campaignService.runCampaign(campaign.id, payload);
    toast.success('Campaign sent successfully');
  } catch (error) {
    toast.error('Failed to send campaign');
    console.error('🚫 Run campaign failed:', error);
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
                    <span>{campaign.template_name}</span>
                    <span>{campaign.contact_ids.length} contacts</span>
                    <span>
                      {campaign.createdAt ? format(new Date(campaign.createdAt), 'PP') : '—'}
                    </span>     
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
          {isImageHeader && (
            <div>
              <label className="block text-sm font-medium mb-1">Upload Header Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadedImage(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          )}

          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Contacts *</label>
              <input
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = async () => {
                    const csvText = reader.result as string;
                    try {
                      await contactService.importContactsFromCSV(csvText);
                      const updatedContacts = await contactService.getAllContacts();
                      setContacts(updatedContacts);
                      toast.success('Contacts imported');
                    } catch (err) {
                      toast.error('Failed to import CSV');
                    }
                  };
                  reader.readAsText(file);
                }}
                className="text-sm"
              />
          </div>
            <div className="border border-gray-300 rounded p-2 max-h-48 overflow-y-auto">
              <label className="flex items-center gap-2 py-1 font-semibold">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const allContactIds = contacts.map((c) => c.id);
                    if (e.target.checked) {
                      // Select all
                      reset({ ...watch(), contactIds: allContactIds });
                    } else {
                      // Deselect all
                      reset({ ...watch(), contactIds: [] });
                    }
                  }}
                  className="accent-blue-500"
                />
                <span>Select All Contacts</span>
              </label>

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
