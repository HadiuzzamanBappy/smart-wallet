import React, { useState } from 'react';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import AboutModal from './AboutModal';

const UserMenuDropdown = ({
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile, user } = useAuth();

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
      label: 'About',
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
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] border border-gray-200 dark:border-white/10 transition-all active:scale-95"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-teal-500/20 overflow-hidden">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={userProfile?.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 z-20 animate-in fade-in slide-in-from-top-2">
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Account</div>
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate opacity-80">
                {userProfile?.email}
              </p>
            </div>
            <div className="p-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isSignOut = item.label === 'Sign Out';
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isSignOut) {
                        if (logoutLoading) return;
                        item.onClick();
                      } else {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    disabled={isSignOut && logoutLoading}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isSignOut
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      } ${isSignOut && logoutLoading ? 'opacity-60 cursor-wait' : 'active:scale-[0.98]'}`}
                  >
                    <Icon className="w-4 h-4 opacity-70" />
                    <span className="flex-1 text-left uppercase tracking-widest">{item.label}</span>
                    {isSignOut && logoutLoading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <AboutModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default UserMenuDropdown;