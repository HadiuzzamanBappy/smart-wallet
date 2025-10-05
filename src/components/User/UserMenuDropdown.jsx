import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import { User, Settings, Key, LogOut, ChevronDown, HelpCircle } from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import HelpModal from './HelpModal';
import Modal from '../UI/Modal';

const UserMenuDropdown = () => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsOpen(false);
  };

  const handleEditProfile = () => {
    setCurrentPage('profile');
    setIsOpen(false);
  };

  const handleSettings = () => {
    setCurrentPage('settings');
    setIsOpen(false);
  };

  const handleHelp = () => {
    setCurrentPage('help');
    setIsOpen(false);
  };

  // reset password functionality removed per request

  const handleBackToMain = () => {
    setCurrentPage(null);
  };

  if (!user) return null;

  const getPageTitle = () => {
    switch (currentPage) {
      case 'profile': return 'Profile';
      case 'settings': return 'Settings';
      case 'help': return 'Help & Support';
      default: return '';
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'profile': return <ProfileModal />;
      case 'settings': return <SettingsModal />;
      case 'help': return <HelpModal />;
      default: return null;
    }
  };

  const displayName = userProfile?.displayName || user?.email || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:px-3 sm:py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 bg-teal-500 dark:bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userInitial}
          </div>
          <span className="hidden md:block text-sm font-medium max-w-32 truncate">
            {displayName}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>

          <button
            onClick={handleEditProfile}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <User className="w-4 h-4" />
            Edit Profile
          </button>

          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          {/* Reset Password removed */}

          <button
            onClick={handleHelp}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </button>

          <hr className="my-2 border-gray-200 dark:border-gray-700" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
      </div>

      {/* Modal for Profile, Settings, Help pages */}
      <Modal
        isOpen={currentPage !== null}
        onClose={handleBackToMain}
        title={getPageTitle()}
        isMobile={isMobile}
      >
        {renderPageContent()}
      </Modal>
    </>
  );
};

export default UserMenuDropdown;