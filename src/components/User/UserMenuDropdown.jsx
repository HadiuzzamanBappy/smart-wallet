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
import Badge from '../UI/base/Badge';
import IconBox from '../UI/base/IconBox';
import GlassCard from '../UI/base/GlassCard';

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
            <div style="font-family:inherit;font-size:14px;font-weight:300;letter-spacing:0.1em;color:#fff;text-transform:uppercase">Securing Account...</div>
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
    <div className="relative flex items-center">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen ? 'soft' : 'gray'}
        color={isOpen ? 'primary' : 'ink'}
        size="icon"
        className={`!w-10 !h-10 !p-0 !rounded-xl overflow-hidden shadow-lg shadow-paper-200 dark:shadow-ink-950/40 transition-all duration-300 ${isOpen ? 'ring-2 ring-primary-500/20' : ''}`}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={userProfile?.displayName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-body uppercase">
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
          <div className="absolute right-0 top-full mt-3 w-64 bg-surface-card dark:bg-surface-card-dark backdrop-blur-2xl rounded-3xl shadow-2xl border border-paper-200/60 dark:border-paper-900/10 z-20 animate-in fade-in zoom-in-95 origin-top-right duration-200 overflow-hidden">
            <GlassCard variant="flat" padding="p-4" className="border-b border-paper-100 dark:border-paper-900/10 bg-paper-100/30 dark:bg-ink-900/10 rounded-none">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg shadow-primary-500/10 overflow-hidden border-2 border-white dark:border-ink-950">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={userProfile?.displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="drop-shadow-md">
                        {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-500 border-2 border-white dark:border-ink-950 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body text-ink-900 dark:text-paper-50 truncate">
                    {userProfile?.displayName || 'User Account'}
                  </p>
                  <p className="text-label text-ink-400 dark:text-paper-600 truncate mt-0.5 opacity-60">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
            </GlassCard>

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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${isSignOut
                      ? 'text-error-600 dark:text-error-400 hover:bg-error-500/5'
                      : 'text-ink-600 dark:text-paper-400 hover:bg-paper-100 dark:hover:bg-ink-900/40 hover:text-ink-900 dark:hover:text-paper-50'
                      } ${isSignOut && logoutLoading ? 'opacity-60 cursor-wait' : 'active:scale-[0.98] group'}`}
                  >
                    <IconBox 
                      icon={Icon} 
                      size="xs" 
                      variant="glass" 
                      color={isSignOut ? 'error' : 'ink'}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="flex-1 text-left text-label">{item.label}</span>
                    {isSignOut && logoutLoading && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>

            <GlassCard variant="flat" padding="px-4 py-3" className="bg-paper-100/30 dark:bg-ink-900/10 border-t border-paper-100 dark:border-paper-900/10 rounded-none">
              <div className="flex items-center justify-between">
                <Badge variant="glass" color="ink" size="sm" className="opacity-50">
                  v1.2.0 Audited
                </Badge>
                <span className="text-overline text-primary-600 dark:text-primary-500/50 uppercase">Vault Secure</span>
              </div>
            </GlassCard>
          </div>
        </>
      )}
      <AboutModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default UserMenuDropdown;