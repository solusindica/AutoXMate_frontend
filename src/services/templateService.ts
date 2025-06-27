// src/services/templateService.ts

 import axios from '../api/axios'
import { Template } from '../types';

export const getAllTemplates = async (): Promise<Template[]> => {
  const response = await axios.get('/templates/meta');
  return response.data.data || []; // ✅ fix: only return the array
};

export const createTemplateInMeta = async (template: any): Promise<any> => {
  const response = await axios.post('/templates/create-meta', template);
  return response.data;
};
