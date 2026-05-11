# Issue 5: Login page — magic link tab

## Parent

None

## What to build

Add the **Magic link** tab to the existing `/login` page (built in #4). The tab contains a single email field. On submission it calls Supabase `signInWithOtp()` and shows a "Check your inbox for a sign-in link" confirmation message. The tab is fully accessible and follows the same visual style as the Password tab.

## Acceptance criteria

- [ ] A "Magic link" tab is visible on the `/login` page alongside the existing "Password" tab
- [ ] Magic link tab contains only an email field and a submit button
- [ ] Submitting a valid email calls Supabase `signInWithOtp()` with `shouldCreateUser: true`
- [ ] On success, the form is replaced with a "Check your inbox" confirmation message
- [ ] On Supabase error, an inline error message is shown without a page reload
- [ ] Switching between tabs resets any error or confirmation messages
- [ ] All form inputs have accessible labels
- [ ] Tests cover: submitting email calls `signInWithOtp`; success shows confirmation; error shows error message; switching tabs clears state
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #4 (magic link tab is added to the password auth page built in #4)
