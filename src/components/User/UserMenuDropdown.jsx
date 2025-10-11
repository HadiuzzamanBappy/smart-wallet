import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown
} from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import HelpModal from './HelpModal';

const UserMenuDropdown = ({ 
  onOpenProfile, 
  onOpenSettings,
  onOpenHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile } = useAuth();
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleLogout = async () => {
    // Show spinner immediately, keep it visible for at least 2s or until logout completes
    try {
      setLogoutLoading(true);

      // Create a global overlay synchronously so it's appended to document.body
      // before any navigation or auth-state-driven redirect can occur. This
      // ensures the loader is visible first.
      let overlay = document.getElementById('logout-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.setAttribute('id', 'logout-overlay');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0,0,0,0.6)';
        overlay.style.zIndex = '9999';
        overlay.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px;border-radius:8px;background:rgba(255,255,255,0.04);backdrop-filter:blur(6px);color:#fff">
            <svg class="animate-spin" style="height:40px;width:40px;color:rgba(148,163,184,1)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <div style="font-size:16px;color:#e5e7eb">Logging out...</div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      // allow the browser one frame to paint the newly appended overlay
      await new Promise((res) => requestAnimationFrame(res));

      // Wait the minimum spinner display time before performing logout. This
      // ensures we show the animation first, then call logoutUser which may
      // trigger navigation/unauth state. The overlay is already appended so
      // it will persist during the logout sequence.
      const minMs = 2000;
      await new Promise((res) => setTimeout(res, minMs));

      // Now perform the actual logout; unauth view/navigation will happen after
      // this point.
      let ok = true;
      try {
        await logoutUser();
      } catch (error) {
        ok = false;
        console.error('Logout failed:', error);
      }

      // If logout succeeded, close the menu. If it failed, keep the menu open so user can retry.
      if (ok) setIsOpen(false);
      // remove overlay
      try {
        const el = document.getElementById('logout-overlay');
        if (el) document.body.removeChild(el);
      } catch {
        /* ignore */
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  const [logoutLoading, setLogoutLoading] = useState(false);

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
      icon: HelpCircle,
      label: 'Help & Tips',
      onClick: () => {
        if (typeof onOpenHelp === 'function') return onOpenHelp();
        setIsHelpOpen(true);
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
                const isSignOut = item.label === 'Sign Out';
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isSignOut) {
                        if (logoutLoading) return; // prevent double clicks
                        item.onClick();
                        // do not auto-close here; handleLogout will close on success
                      } else {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    disabled={isSignOut && logoutLoading}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      item.className || 'text-gray-700 dark:text-gray-300'
                    } ${isSignOut && logoutLoading ? 'opacity-60 cursor-wait' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex items-center gap-2">
                      {item.label}
                      {isSignOut && logoutLoading && (
                        <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default UserMenuDropdown;