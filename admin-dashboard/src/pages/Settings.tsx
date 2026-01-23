/**
 * Settings Page
 * System settings and configuration
 */

import React, { useState } from 'react';
import { Save, Bell, Lock, Globe, Palette, Users, Database } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Input';

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'data', label: 'Data & Privacy', icon: Database },
];

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General
    companyName: 'EmenTech',
    timezone: 'Africa/Nairobi',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    mentionAlerts: true,

    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipWhitelist: '',

    // Appearance
    theme: 'light',
    primaryColor: 'blue',
    compactMode: false,

    // Team
    allowSelfSignup: false,
    defaultUserRole: 'employee',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your system preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">
          {activeSection === 'general' && (
            <Card>
              <CardHeader title="General Settings" subtitle="Basic system configuration" />
              <div className="space-y-6 max-w-xl">
                <Input
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) => updateSetting('companyName', e.target.value)}
                />
                <Select
                  label="Timezone"
                  options={[
                    { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
                    { value: 'America/New_York', label: 'America/New_York (EST)' },
                    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
                    { value: 'Europe/London', label: 'Europe/London (GMT)' },
                  ]}
                  value={settings.timezone}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                />
                <Select
                  label="Date Format"
                  options={[
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  ]}
                  value={settings.dateFormat}
                  onChange={(e) => updateSetting('dateFormat', e.target.value)}
                />
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" subtitle="Configure how you receive alerts" />
              <div className="space-y-6 max-w-xl">
                <Checkbox
                  label="Email Notifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                />
                <Checkbox
                  label="Push Notifications"
                  checked={settings.pushNotifications}
                  onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                />
                <Checkbox
                  label="Weekly Digest Email"
                  checked={settings.weeklyDigest}
                  onChange={(e) => updateSetting('weeklyDigest', e.target.checked)}
                />
                <Checkbox
                  label="@Mention Alerts"
                  checked={settings.mentionAlerts}
                  onChange={(e) => updateSetting('mentionAlerts', e.target.checked)}
                />
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader title="Security Settings" subtitle="Protect your account" />
              <div className="space-y-6 max-w-xl">
                <Checkbox
                  label="Two-Factor Authentication"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
                />
                <Input
                  type="number"
                  label="Session Timeout (minutes)"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                />
                <Textarea
                  label="IP Whitelist (one per line)"
                  value={settings.ipWhitelist}
                  onChange={(e) => updateSetting('ipWhitelist', e.target.value)}
                  rows={4}
                  helperText="Only these IPs will be able to access the admin panel"
                />
              </div>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader title="Appearance" subtitle="Customize the look and feel" />
              <div className="space-y-6 max-w-xl">
                <Select
                  label="Theme"
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'auto', label: 'System' },
                  ]}
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                />
                <Select
                  label="Primary Color"
                  options={[
                    { value: 'blue', label: 'Blue' },
                    { value: 'green', label: 'Green' },
                    { value: 'purple', label: 'Purple' },
                    { value: 'orange', label: 'Orange' },
                  ]}
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                />
                <Checkbox
                  label="Compact Mode"
                  checked={settings.compactMode}
                  onChange={(e) => updateSetting('compactMode', e.target.checked)}
                />
              </div>
            </Card>
          )}

          {activeSection === 'team' && (
            <Card>
              <CardHeader title="Team Settings" subtitle="Manage team access and defaults" />
              <div className="space-y-6 max-w-xl">
                <Checkbox
                  label="Allow Self-Registration"
                  checked={settings.allowSelfSignup}
                  onChange={(e) => updateSetting('allowSelfSignup', e.target.checked)}
                />
                <Select
                  label="Default User Role"
                  options={[
                    { value: 'employee', label: 'Employee' },
                    { value: 'manager', label: 'Manager' },
                  ]}
                  value={settings.defaultUserRole}
                  onChange={(e) => updateSetting('defaultUserRole', e.target.value)}
                />
              </div>
            </Card>
          )}

          {activeSection === 'data' && (
            <Card>
              <CardHeader title="Data & Privacy" subtitle="Manage your data" />
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Data export and deletion actions cannot be undone.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary">Export All Data</Button>
                  <Button variant="danger">Delete Account</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end gap-4">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};
