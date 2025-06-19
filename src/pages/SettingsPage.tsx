import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { WhatsAppConfig } from '../types';
import * as authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { Save, TestTube, Eye, EyeOff, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from '../api/axios';

interface WhatsAppForm {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookUrl: string;
  webhookToken: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'account'>('whatsapp');

  const whatsappForm = useForm<WhatsAppForm>();
  const passwordForm = useForm<PasswordForm>();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/settings/whatsapp');
      const data = response.data;
      setConfig(data);
      whatsappForm.reset(data);
    } catch (error) {
      toast.error('Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhatsAppConfig = async (data: WhatsAppForm) => {
    setSaving(true);
    try {
      const response = await axios.put('/settings/whatsapp', data);
      setConfig(response.data);
      toast.success('WhatsApp configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await axios.get('/settings/test');
      toast.success('WhatsApp connection test successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleChangePassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
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
      <Header title="Settings" subtitle="Manage your account and WhatsApp configuration" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <Button
            variant={activeTab === 'whatsapp' ? 'primary': 'outline'}
            onClick={() => setActiveTab('whatsapp')}
            className="mr-2"
          >
            WhatsApp Settings
          </Button>
          <Button
            variant={activeTab === 'account' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('account')}
          >
            Account Settings
          </Button>
        </div>

        {activeTab === 'whatsapp' && (
          <Card>
            <form onSubmit={whatsappForm.handleSubmit(handleSaveWhatsAppConfig)} className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Smartphone size={20} /> WhatsApp API Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Access Token" {...whatsappForm.register('accessToken')} type={showTokens ? 'text' : 'password'} />
                <input placeholder="Phone Number ID" {...whatsappForm.register('phoneNumberId')} />
                <input placeholder="Business Account ID" {...whatsappForm.register('businessAccountId')} />
                <input placeholder="Webhook URL" {...whatsappForm.register('webhookUrl')} />
                <input placeholder="Webhook Token" {...whatsappForm.register('webhookToken')} type={showTokens ? 'text' : 'password'} />
              </div>

              <div className="flex gap-4 mt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" onClick={handleTestConnection} disabled={testing} variant="secondary">
                  <TestTube className="mr-2 h-4 w-4" />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button type="button" onClick={() => setShowTokens(!showTokens)} variant="ghost">
                  {showTokens ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showTokens ? 'Hide Tokens' : 'Show Tokens'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'account' && (
          <Card>
            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Badge>👤</Badge> Change Password
              </h2>

              <input type="password" placeholder="Current Password" {...passwordForm.register('currentPassword')} />
              <input type="password" placeholder="New Password" {...passwordForm.register('newPassword')} />
              <input type="password" placeholder="Confirm New Password" {...passwordForm.register('confirmPassword')} />

              <Button type="submit">Change Password</Button>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  );
};
