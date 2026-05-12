'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Trash2, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { deleteAccount } from '@/lib/actions/deleteAccount';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { NAV_ITEMS } from '@/lib/nav';

const TopBar = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    const result = await deleteAccount();
    if (result.error) {
      setDeleteError(result.error);
      return; // keep dialog open to show error
    }
    setDeleteDialogOpen(false);
    // On success the session is gone; AuthProvider will clear user state
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-14 border-b border-border bg-card grid grid-cols-2 lg:grid-cols-3 items-center px-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="font-display text-xl font-semibold text-primary tracking-tight">
            FoodFilter
          </Link>
        </div>

        {/* Center: Desktop nav — hidden on mobile, flex row on lg+ */}
        <nav aria-label="Desktop navigation" className="hidden lg:flex items-center justify-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ` +
                  (isActive
                    ? 'bg-secondary text-secondary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Account menu */}
        <div className="flex items-center justify-end">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                <User size={16} aria-hidden="true" />
                <span className="max-w-[120px] truncate hidden sm:inline">{user.email}</span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={dropdownOpen ? 'rotate-180 transition-transform duration-150' : 'transition-transform duration-150'}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium truncate text-foreground mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      Sign out
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDropdownOpen(false); setDeleteDialogOpen(true); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Delete account
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete account?"
        description="This action cannot be undone. Your account and all associated data will be permanently deleted."
        confirmLabel="Delete account"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteAccount}
        error={deleteError}
      />
    </>
  );
};

export default TopBar;

