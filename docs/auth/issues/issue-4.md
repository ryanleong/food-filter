# Issue 4: Login page — password auth

## Parent

None

## What to build

Build the `/login` page with email + password authentication. The page has two modes toggled by a link: **Sign in** (default) and **Create account**. Sign-in submits credentials to Supabase and redirects to `/dashboard` on success. Sign-up sends a confirmation email and shows a "Check your email" message (no redirect until confirmed). A "Forgot password?" link triggers Supabase `resetPasswordForEmail()` and shows a confirmation message. The magic link tab is a placeholder in this issue (built in #5).

## Acceptance criteria

- [ ] `/login` route renders the login page; unauthenticated users can reach it freely
- [ ] Password tab is the default active tab
- [ ] Sign-in mode: email field + password field + submit button
- [ ] Submitting valid credentials calls Supabase email+password sign-in and redirects to `/dashboard`
- [ ] Submitting invalid credentials displays an inline error message without a page reload
- [ ] Sign-up toggle switches to "Create account" mode, adding a confirm-password field
- [ ] Mismatched passwords in sign-up mode shows a client-side validation error before submission
- [ ] Successful sign-up shows "Check your email to confirm your account" and does not redirect
- [ ] "Forgot password?" link triggers `resetPasswordForEmail()` and shows a "Reset email sent" confirmation
- [ ] All form inputs have accessible labels
- [ ] Tests cover: successful sign-in → redirect; invalid credentials → error shown; sign-up toggle shows confirm-password; password mismatch → validation error; successful sign-up → confirmation message; forgot password → confirmation message
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #1 (requires browser Supabase client)
- Blocked by #3 (middleware must exist so redirect-after-login works correctly)
