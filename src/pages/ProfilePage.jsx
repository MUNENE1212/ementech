import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Building, Key, ArrowLeft } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, changePassword, updateUser } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordLoading(true);
    setPasswordMessage('');

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        setPasswordMessage({
          type: 'success',
          text: 'Password changed successfully!',
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
      } else {
        setPasswordMessage({
          type: 'error',
          text: result.message || 'Failed to change password',
        });
      }
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'manager':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

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
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-2">Manage your account settings</p>
        </div>

        {/* Profile Information Card */}
        <div className="bg-dark-900 rounded-lg shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Personal Information</h2>
              <p className="text-gray-400">Your account details</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role)}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div className="flex items-center p-4 bg-dark-800 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <User className="text-blue-400" size={24} />
                </div>
              </div>
              <div className="ml-4 flex-grow">
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="text-lg font-medium text-white">{user?.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center p-4 bg-dark-800 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Mail className="text-green-400" size={24} />
                </div>
              </div>
              <div className="ml-4 flex-grow">
                <p className="text-sm text-gray-400">Email Address</p>
                <p className="text-lg font-medium text-white">{user?.email}</p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center p-4 bg-dark-800 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Building className="text-purple-400" size={24} />
                </div>
              </div>
              <div className="ml-4 flex-grow">
                <p className="text-sm text-gray-400">Department</p>
                <p className="text-lg font-medium text-white capitalize">{user?.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-dark-900 rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Security</h2>
              <p className="text-gray-400">Change your password</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg transition-colors"
            >
              <Key size={18} className="mr-2" />
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {passwordMessage && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                passwordMessage.type === 'success'
                  ? 'bg-green-500/10 border-green-500 text-green-400'
                  : 'bg-red-500/10 border-red-500 text-red-400'
              }`}
            >
              <p className="text-sm">{passwordMessage.text}</p>
            </div>
          )}

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 bg-dark-800 border ${
                    passwordErrors.currentPassword ? 'border-red-500' : 'border-dark-700'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="••••••••"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-2 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 bg-dark-800 border ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-dark-700'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="••••••••"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-500">{passwordErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 bg-dark-800 border ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-dark-700'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="••••••••"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPasswordLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPasswordLoading ? 'Changing password...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
