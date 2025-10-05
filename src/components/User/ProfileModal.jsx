import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';
import { User, Mail, Calendar, Save, Camera } from 'lucide-react';

const ProfileModal = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    email: user?.email || '',
    phoneNumber: userProfile?.phoneNumber || '',
    bio: userProfile?.bio || '',
    // currency and monthlyBudget are managed in Settings
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUserProfile(user.uid, formData);
      if (result.success) {
        setUserProfile({ ...userProfile, ...formData });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      email: user?.email || '',
      phoneNumber: userProfile?.phoneNumber || '',
      bio: userProfile?.bio || '',
      // currency and monthlyBudget intentionally omitted
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Edit Profile Button */}
      {!isEditing && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 dark:from-teal-600 dark:to-emerald-600 p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {isEditing && (
              <button className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
          
          {/* Basic Info */}
          <div className="text-center sm:text-left text-white">
            <h2 className="text-xl font-bold">
              {userProfile?.displayName || 'User'}
            </h2>
            <p className="text-white/80">{user?.email}</p>
            {userProfile?.bio && (
              <p className="text-sm text-white/70 mt-1">{userProfile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
              placeholder="Your display name"
            />
          </div>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
            placeholder="Your phone number"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            disabled={!isEditing}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Currency and Monthly Budget are managed in Settings */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">Preferred currency and monthly budget are managed in <strong>Settings</strong>. Open Settings to change them.</p>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;