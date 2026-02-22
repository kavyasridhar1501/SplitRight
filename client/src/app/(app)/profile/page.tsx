'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/Avatar';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-text-primary text-2xl font-bold mb-6">Profile</h1>

      {/* User card */}
      <div className="card p-5 mb-4 flex items-center gap-4">
        <Avatar name={user.name} color={user.avatar_color} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-text-primary font-semibold text-lg truncate">{user.name}</h2>
          <p className="text-text-muted text-sm truncate">{user.email}</p>
          <p className="text-text-muted text-xs mt-0.5">
            Member since {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      {/* App info */}
      <div className="card mb-4">
        <div className="px-4 py-3 border-b border-slate-border">
          <p className="section-header">App Info</p>
        </div>
        <div className="divide-y divide-slate-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-text-secondary text-sm">Version</span>
            <span className="text-text-muted text-sm">1.0.0</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-text-secondary text-sm">App</span>
            <span className="text-text-muted text-sm">SplitRight</span>
          </div>
        </div>
      </div>

      {/* PWA install hint */}
      <div className="card mb-6 p-4 bg-sage-subtle border border-sage/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <PhoneIcon />
          </div>
          <div>
            <p className="text-sage text-sm font-medium">Add to Home Screen</p>
            <p className="text-text-muted text-xs mt-0.5">
              On iPhone: tap Share → &quot;Add to Home Screen&quot; for a native app experience
            </p>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full py-3.5 rounded-btn border border-negative/30 bg-negative/10 text-negative text-base font-medium touch-target flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
      >
        <LogoutIcon />
        Sign Out
      </button>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60">
          <div className="w-full max-w-mobile bg-slate-elevated rounded-t-2xl border border-slate-border p-5 space-y-4">
            <h3 className="text-text-primary font-semibold text-base">Sign out?</h3>
            <p className="text-text-secondary text-sm">
              You&apos;ll need to sign in again to access SplitRight.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3 text-sm font-medium rounded-btn bg-negative/20 border border-negative/30 text-negative active:opacity-70 transition-opacity touch-target flex items-center justify-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
