/**
 * SettingsPage - User profile settings and account management
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserService } from '../services/user';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (newName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (newName.trim().length > 50) {
      setError('Name cannot exceed 50 characters');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await UserService.updateProfile({ name: newName.trim() });
      
      // Force Firebase to refresh the ID token to get updated claims
      const auth = (await import('../config/firebase')).auth;
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true); // Force token refresh
      }
      
      toast.success('Username updated successfully! Refreshing...');
      setIsEditing(false);
      
      // Reload to get fresh auth state with updated name
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Failed to update username:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update username';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewName(user?.name || '');
    setIsEditing(false);
    setError(null);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-cream)' }}>
      {/* Header */}
      <div className="navbar shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold main-heading">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Profile Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile Information</h2>
            
            {/* Username */}
            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Username
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input text-base"
                    placeholder="Enter your name"
                    disabled={isSaving}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn btn-primary !py-2"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-semibold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>{user.name}</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-ghost !py-2 !px-4 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Email Address
              </label>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium">{user.email}</span>
                <span className="text-xs text-gray-500 italic bg-white px-3 py-1 rounded-full border border-gray-300">🔒 Read-only</span>
              </div>
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Account Role
              </label>
              <span
              className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold ${
                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                user.role === 'organizer' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
