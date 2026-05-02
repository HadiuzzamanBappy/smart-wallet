import React, { useState } from 'react';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import AboutModal from './AboutModal';
import Button from '../UI/base/Button';

const UserMenuDropdown = ({
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile, user } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      // Create a global premium overlay
      let overlay = document.getElementById('logout-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.setAttribute('id', 'logout-overlay');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(15, 23, 42, 0.8)';
        overlay.style.backdropFilter = 'blur(12px)';
        overlay.style.zIndex = '9999';
        overlay.style.animation = 'fade-in 0.3s ease-out';
        overlay.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px;border-radius:24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)">
            <div style="position:relative">
              <svg class="animate-spin" style="height:48px;width:48px;color:#14b8a6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style="opacity:0.2" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path style="opacity:1" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
            <div style="font-family:inherit;font-size:14px;font-weight:700;letter-spacing:0.1em;color:#fff;text-transform:uppercase">Securing Account...</div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      await new Promise((res) => requestAnimationFrame(res));
      const minMs = 1500;
      await new Promise((res) => setTimeout(res, minMs));

      let ok = true;
      try {
        await logoutUser();
      } catch (error) {
        ok = false;
        console.error('Logout failed:', error);
      }

      if (ok) setIsOpen(false);

      const el = document.getElementById('logout-overlay');
      if (el) document.body.removeChild(el);
    } finally {
      setLogoutLoading(false);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'My Profile',
      onClick: onOpenProfile
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: onOpenSettings
    },
    {
      icon: HelpCircle,
      label: 'System Info',
      onClick: () => {
        if (typeof onOpenHelp === 'function') return onOpenHelp();
        setIsHelpOpen(true);
      }
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      onClick: handleLogout,
      className: 'text-red-400'
    }
  ];

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen ? 'soft' : 'gray'}
        color={isOpen ? 'teal' : 'gray'}
        size="icon"
        className={`!w-10 !h-10 !p-0 !rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-teal-500/20' : ''}`}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={userProfile?.displayName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[13px] font-black uppercase tracking-widest">
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/60 dark:border-white/10 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userProfile?.displayName}
                      className="w-full h-full object-cover rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="drop-shadow-md">
                      {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                    {userProfile?.displayName || 'User Account'}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 truncate mt-1 uppercase tracking-widest">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2.5">
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
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[11px] font-black transition-all ${isSignOut
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                      } ${isSignOut && logoutLoading ? 'opacity-60 cursor-wait' : 'active:scale-[0.98] group'}`}
                  >
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isSignOut ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`} />
                    <span className="flex-1 text-left uppercase tracking-widest">{item.label}</span>
                    {isSignOut && logoutLoading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-gray-50 dark:bg-white/5 px-5 py-3 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Version 1.2.0 Stable</span>
                <span className="text-[9px] font-black text-teal-600 dark:text-teal-500/50 uppercase tracking-widest">Vault Secure</span>
              </div>
            </div>
          </div>
        </>
      )}
      <AboutModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default UserMenuDropdown;