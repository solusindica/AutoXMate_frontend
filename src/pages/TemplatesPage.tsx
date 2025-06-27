// src/pages/TemplatesPage.tsx

import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as templateService from '../services/templateService';

interface TemplateForm {
  name: string;
  category: string;
  language: string;
  type: string;
  header?: string;
  body: string;
  footer?: string;
  media_url?: string;
  buttons: { type: string; text: string; url?: string }[];
}

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, watch, reset, control } = useForm<TemplateForm>({
    defaultValues: {
      category: 'MARKETING',
      language: 'en_US',
      type: 'text',
      buttons: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'buttons' });

  const type = watch('type');

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to fetch templates');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const onSubmit = async (formData: TemplateForm) => {
    try {
      const components: any[] = [];

      if (formData.header) {
        components.push({
          type: 'HEADER',
          parameters: formData.type === 'image'
            ? [{ type: 'image', image: { link: formData.media_url } }]
            : [{ type: 'text', text: formData.header }]
        });
      }

      components.push({
        type: 'BODY',
        parameters: [{ type: 'text', text: formData.body }]
      });

      if (formData.footer) {
        components.push({
          type: 'FOOTER',
          text: formData.footer
        });
      }

      if (formData.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: formData.buttons.map(b => ({
            type: b.type,
            text: b.text,
            url: b.url
          }))
        });
      }

      await templateService.createTemplateInMeta({
        ...formData,
        components
      });

      toast.success('Template submitted to Meta successfully');
      setIsModalOpen(false);
      reset();
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to create template');
      console.error(err);
    }
  };

  return (
    <Layout>
      <Header title="Templates" />
      <div className="p-4">
        <Button onClick={() => setIsModalOpen(true)}>
          + Create Template
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <h3 className="text-lg font-bold">{template.name}</h3>
              <p>{template.body}</p>
              <p className="text-sm text-gray-500">{template.category} • {template.language}</p>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create WhatsApp Template">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register('name')} placeholder="Template Name" required />
          <select {...register('category')}>
            <option value="MARKETING">Marketing</option>
            <option value="TRANSACTIONAL">Transactional</option>
          </select>
          <select {...register('language')}>
            <option value="en_US">English</option>
            <option value="hi_IN">Hindi</option>
          </select>
          <select {...register('type')}>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>

          <input {...register('header')} placeholder="Header (optional)" />
          {type !== 'text' && (
            <input {...register('media_url')} placeholder="Media URL (image/video)" />
          )}
          <textarea {...register('body')} placeholder="Body" required />
          <input {...register('footer')} placeholder="Footer (optional)" />

          <div>
            <h4 className="font-semibold">Buttons</h4>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 mb-2">
                <select {...register(`buttons.${index}.type`)}>
                  <option value="url">URL</option>
                  <option value="call">Call</option>
                  <option value="quick_reply">Quick Reply</option>
                </select>
                <input {...register(`buttons.${index}.text`)} placeholder="Text" />
                <input {...register(`buttons.${index}.url`)} placeholder="URL or Number" />
                <Button onClick={() => remove(index)} type="button">Remove</Button>
              </div>
            ))}
            <Button type="button" onClick={() => append({ type: 'url', text: '', url: '' })}>
              + Add Button
            </Button>
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </Modal>
    </Layout>
  );
};
