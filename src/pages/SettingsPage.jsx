import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Building,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Shield,
  Globe,
  Monitor,
  Palette
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, changePassword, updateUser } = useAuth();

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'engineering',
  });

  // Password settings
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    leadAlerts: true,
    weeklyReports: true,
    securityAlerts: true,
  });

  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Monitor },
  ];

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};
    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(profileForm.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Update user context
      updateUser({
        name: profileForm.name,
        email: profileForm.email,
        department: profileForm.department,
      });

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Password changed successfully!',
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Failed to change password',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSave} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            id="name"
            name="name"
            type="text"
            value={profileForm.name}
            onChange={handleProfileChange}
            className={`w-full pl-10 pr-4 py-3 bg-dark-800 border ${
              errors.name ? 'border-red-500' : 'border-dark-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Your full name"
          />
        </div>
        {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            id="email"
            name="email"
            type="email"
            value={profileForm.email}
            onChange={handleProfileChange}
            className={`w-full pl-10 pr-4 py-3 bg-dark-800 border ${
              errors.email ? 'border-red-500' : 'border-dark-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="your.email@ementech.co.ke"
          />
        </div>
        {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
          Department
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            id="department"
            name="department"
            value={profileForm.department}
            onChange={handleProfileChange}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
          >
            <option value="leadership">Leadership</option>
            <option value="engineering">Engineering</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="hr">Human Resources</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <Save size={20} className="mr-2" />
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );

  const renderSecurityTab = () => (
    <form onSubmit={handlePasswordSave} className="space-y-6">
      <div className="flex items-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <Shield className="text-blue-400 mr-3" size={24} />
        <div>
          <p className="text-sm text-blue-400 font-medium">Password Security</p>
          <p className="text-xs text-gray-400">Use a strong password with at least 6 characters</p>
        </div>
      </div>

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Current Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            id="currentPassword"
            name="currentPassword"
            type={showPassword ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
            className={`w-full pl-10 pr-12 py-3 bg-dark-800 border ${
              errors.currentPassword ? 'border-red-500' : 'border-dark-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.currentPassword && <p className="mt-2 text-sm text-red-500">{errors.currentPassword}</p>}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            id="newPassword"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            className={`w-full pl-10 pr-12 py-3 bg-dark-800 border ${
              errors.newPassword ? 'border-red-500' : 'border-dark-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="••••••••"
          />
        </div>
        {errors.newPassword && <p className="mt-2 text-sm text-red-500">{errors.newPassword}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            className={`w-full pl-10 pr-12 py-3 bg-dark-800 border ${
              errors.confirmPassword ? 'border-red-500' : 'border-dark-700'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="••••••••"
          />
        </div>
        {errors.confirmPassword && <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <Shield size={20} className="mr-2" />
        {isLoading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-4">
      {[
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email updates about your account' },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in browser' },
        { key: 'leadAlerts', label: 'Lead Alerts', description: 'Get notified when new leads are captured' },
        { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly performance reports' },
        { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security notifications' },
      ].map(({ key, label, description }) => (
        <div
          key={key}
          className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700"
        >
          <div className="flex-1">
            <p className="text-white font-medium">{label}</p>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <button
            onClick={() => handleNotificationChange(key)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notificationSettings[key] ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificationSettings[key] ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderDisplayTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-4">
          {['dark', 'light', 'system'].map((theme) => (
            <button
              key={theme}
              onClick={() => setDisplaySettings(prev => ({ ...prev, theme }))}
              className={`p-4 rounded-lg border-2 transition-colors ${
                displaySettings.theme === theme
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-dark-700 bg-dark-800 hover:border-dark-600'
              }`}
            >
              <Palette className="mx-auto mb-2" size={24} />
              <p className="text-sm text-center capitalize text-white">{theme}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
          Language
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            id="language"
            value={displaySettings.language}
            onChange={(e) => setDisplaySettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          value={displaySettings.timezone}
          onChange={(e) => setDisplaySettings(prev => ({ ...prev, timezone: e.target.value }))}
          className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="UTC">UTC (Coordinated Universal Time)</option>
          <option value="EST">EST (Eastern Standard Time)</option>
          <option value="PST">PST (Pacific Standard Time)</option>
          <option value="EAT">EAT (East Africa Time)</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500 text-green-400'
                : 'bg-red-500/10 border-red-500 text-red-400'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="bg-dark-900 rounded-lg shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-dark-800">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage(null);
                    }}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-dark-800'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                    }`}
                  >
                    <Icon size={18} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'display' && renderDisplayTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
