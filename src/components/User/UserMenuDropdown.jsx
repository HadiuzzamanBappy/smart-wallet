import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  Download, 
  Trash2, 
  Moon, 
  Sun, 
  Globe,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { logoutUser } from '../../services/authService';

const UserMenuDropdown = ({ 
  onOpenProfile, 
  onOpenSettings, 
  currentLanguage,
  onLanguageToggle 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      onClick: onOpenProfile
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: onOpenSettings
    },
    {
      icon: isDark ? Sun : Moon,
      label: isDark ? 'Light Mode' : 'Dark Mode',
      onClick: toggleTheme
    },
    {
      icon: Globe,
      label: `Switch to ${currentLanguage === 'en' ? 'Bengali' : 'English'}`,
      onClick: onLanguageToggle
    },
    {
      icon: Download,
      label: 'Export Data',
      onClick: () => {
        // Will implement this when we add export functionality
        console.log('Export data clicked');
        setIsOpen(false);
      }
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      onClick: handleLogout,
      className: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
          {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        {/* <span className="text-gray-700 dark:text-gray-300 font-medium hidden sm:block">
          {userProfile?.displayName || 'User'}
        </span> */}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 animate-in fade-in slide-in-from-top">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userProfile?.email}
              </p>
            </div>
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      if (item.label !== 'Sign Out') {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      item.className || 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenuDropdown;