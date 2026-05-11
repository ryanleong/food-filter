'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteAccount } from '@/lib/actions/deleteAccount';

const TopBar = () => {
  const { user, signOut } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    const result = await deleteAccount();
    if (result.error) {
      setDeleteError(result.error);
    }
    // On success the session is gone; AuthProvider will clear user state
  };

  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b bg-background flex items-center px-4 justify-between">
      <Link href="/" className="font-bold text-lg tracking-tight">
        FoodFilter
      </Link>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        {user && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm text-muted-foreground truncate max-w-[200px]">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your account and all associated data will be
                    permanently deleted.
                    {deleteError && (
                      <span className="block text-destructive mt-2">{deleteError}</span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;

