// src/services/contactService.ts
import { Contact } from '../types';

const API_BASE = 'https://autoxmate-backend.onrender.com'; // or your actual base URL

export const getAllContacts = async (): Promise<Contact[]> => {
  const response = await fetch(`${API_BASE}/contacts`);
  const data = await response.json();

  return data.map((contact: any) => ({
    ...contact,
    createdAt: new Date(contact.createdAt),
    updatedAt: new Date(contact.updatedAt),
    lastMessageAt: contact.lastMessageAt ? new Date(contact.lastMessageAt) : undefined,
  }));
};

export const createContact = async (contact: Partial<Contact>): Promise<Contact> => {
  const response = await fetch(`${API_BASE}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });

  const data = await response.json();
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastMessageAt: data.lastMessageAt ? new Date(data.lastMessageAt) : undefined,
  };
};

export const updateContact = async (id: string, contact: Partial<Contact>): Promise<Contact> => {
  const response = await fetch(`${API_BASE}/contacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });

  const data = await response.json();
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastMessageAt: data.lastMessageAt ? new Date(data.lastMessageAt) : undefined,
  };
};

export const deleteContact = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/contacts/${id}`, {
    method: 'DELETE',
  });
};

export const importContactsFromCSV = async (csvText: string): Promise<any> => {
  const blob = new Blob([csvText], { type: 'text/csv' });
  const file = new File([blob], 'contacts.csv', { type: 'text/csv' });

  const formData = new FormData();
  formData.append('file', file); // 👈 backend expects key name to be "file"

  const response = await fetch(`${API_BASE}/contacts/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to import contacts: ${errorText}`);
  }

  return await response.json();
};

