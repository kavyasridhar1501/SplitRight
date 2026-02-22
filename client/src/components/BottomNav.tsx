'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#6b9e78' : 'none'} stroke={active ? '#6b9e78' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GroupsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6b9e78' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BalancesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6b9e78' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6b9e78' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/groups') return pathname.startsWith('/groups') && !pathname.includes('/add') && !pathname.includes('/balances');
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-slate-surface border-t border-slate-border z-40">
      <div className="flex items-center justify-around px-2 safe-bottom pb-2">
        {/* Home */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 touch-target justify-center px-4"
        >
          <HomeIcon active={isActive('/dashboard')} />
          <span className={`text-[10px] font-medium ${isActive('/dashboard') ? 'text-sage' : 'text-text-muted'}`}>
            Home
          </span>
        </Link>

        {/* Groups */}
        <Link
          href="/groups"
          className="flex flex-col items-center gap-1 touch-target justify-center px-4"
        >
          <GroupsIcon active={isActive('/groups')} />
          <span className={`text-[10px] font-medium ${isActive('/groups') ? 'text-sage' : 'text-text-muted'}`}>
            Groups
          </span>
        </Link>

        {/* Center Add Button */}
        <button
          onClick={() => router.push('/groups/new')}
          className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-sage shadow-lg active:bg-sage-soft active:scale-95 transition-all border-4 border-slate-base"
          aria-label="Create group or add expense"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Balances */}
        <Link
          href="/balances"
          className="flex flex-col items-center gap-1 touch-target justify-center px-4"
        >
          <BalancesIcon active={isActive('/balances')} />
          <span className={`text-[10px] font-medium ${isActive('/balances') ? 'text-sage' : 'text-text-muted'}`}>
            Balances
          </span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 touch-target justify-center px-4"
        >
          <ProfileIcon active={isActive('/profile')} />
          <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-sage' : 'text-text-muted'}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
