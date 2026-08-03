import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import AboutModal from './AboutModal';
import Button from '../UI/base/Button';
import Badge from '../UI/base/Badge';
import IconBox from '../UI/base/IconBox';
import GlassCard from '../UI/base/GlassCard';
import LoadingOverlay, { LoadingSpinner } from '../UI/LoadingOverlay';

const UserMenuDropdown = ({
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { userProfile, user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

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
    <div className="relative flex items-center" ref={dropdownRef}>
      {logoutLoading && (
        <div className="fixed inset-0 z-[9999]">
          <LoadingOverlay loading={true} text="Securing Account...">
            <div className="w-screen h-screen bg-stone-50/20 dark:bg-stone-950/20" />
          </LoadingOverlay>
        </div>
      )}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen ? 'soft' : 'gray'}
        color={isOpen ? 'primary' : 'ink'}
        size="icon"
        className={`!w-10 !h-10 !p-0 !rounded-xl overflow-hidden shadow-lg shadow-stone-900/40 transition-all duration-300 ${isOpen ? 'ring-2 ring-primary-500/20' : ''}`}
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
          <div className="absolute right-0 top-full mt-2 w-52 z-20 animate-in fade-in zoom-in-95 origin-top-right duration-200">
            <GlassCard
              variant="thick"
              padding="p-0"
              className="overflow-hidden shadow-2xl border-stone-200 dark:border-stone-800/50"
            >
              {/* Compact Profile Section */}
              <GlassCard variant="flat" padding="p-3" className="bg-white/80 dark:bg-stone-900/40 rounded-none border-none">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center text-white text-base shadow-lg shadow-primary-500/20 overflow-hidden border border-stone-200 dark:border-stone-800">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={userProfile?.displayName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 border border-stone-200 dark:border-stone-800 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label font-bold text-stone-800 dark:text-stone-200 truncate leading-tight">
                      {userProfile?.displayName?.split(' ')[0] || 'User'}
                    </p>
                    <p className="text-label text-stone-600 dark:text-stone-500 dark:text-stone-400 truncate opacity-60 leading-tight">
                      {userProfile?.email}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Tighter Menu Items */}
              <div className="p-1.5 space-y-0.5">
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
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all ${isSignOut
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-200'
                        } ${isSignOut && logoutLoading ? 'opacity-60 cursor-wait' : 'active:scale-[0.98] group'}`}
                    >
                      <IconBox
                        icon={Icon}
                        size="xs"
                        variant="soft"
                        color={isSignOut ? 'error' : 'ink'}
                        className="!p-1.5 !rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <span className="flex-1 text-left text-label ">{item.label}</span>
                      {isSignOut && logoutLoading && (
                        <LoadingSpinner size="xs" color="error" />
                      )}
                    </button>
                  );
                })}
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