# Issue 6: AuthProvider, useAuth hook & account menu

## Parent

None

## What to build

Expose the signed-in user's identity to the entire client-side app and give them a way to sign out or delete their account. Add `AuthProvider` to the React tree (in `app/providers.tsx`) that subscribes to Supabase auth state changes. Create a `useAuth()` hook that returns `{ user, signOut }`. Update `TopBar` to show the user's email and an account dropdown menu with "Sign out" and "Delete account" actions. "Delete account" shows a confirmation dialog before proceeding. On sign-out or deletion, the user is redirected to `/login`.

## Acceptance criteria

- [ ] `AuthProvider` wraps the app in `app/providers.tsx` and provides current user via React context
- [ ] `useAuth()` hook returns `{ user, signOut }` — calling `signOut()` calls Supabase `signOut()` then redirects to `/login`
- [ ] `TopBar` shows the signed-in user's email address
- [ ] `TopBar` includes an account dropdown with "Sign out" and "Delete account" options
- [ ] Clicking "Sign out" calls `signOut()` and redirects to `/login`
- [ ] Clicking "Delete account" opens a confirmation dialog (using the existing `alert-dialog` shadcn component)
- [ ] Confirming deletion calls Supabase to delete the user account and all associated data, then redirects to `/login`
- [ ] Cancelling the delete dialog dismisses it without any action
- [ ] Auth state updates (e.g. session expiry) are reflected in real time without a page reload
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #1 (requires browser Supabase client)
- Blocked by #4 (sign-in must work before sign-out/account features are meaningful)
