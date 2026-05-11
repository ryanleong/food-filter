# Issue 10: Remove localStorage & api/analyze route cleanup

## Parent

None

## What to build

Delete the files and code that have been fully superseded by the Supabase-backed layers built in #7, #8, and #9. This is a cleanup slice with no new features — it verifies the app works end-to-end without any `localStorage` data persistence or the old Route Handler, then removes the dead code.

## Acceptance criteria

- [ ] `app/api/analyze/route.ts` is deleted; no code in the project imports or references it
- [ ] `lib/storage.ts` is deleted; no code in the project imports from it
- [ ] `localStorage` is no longer read or written for blacklist or history data anywhere in the codebase
- [ ] `sessionStorage` key `foodfilter_current_scan` is retained (used for results page handoff — not user data)
- [ ] `StorageBanner` component (which warned about localStorage unavailability) is removed or repurposed if no longer relevant
- [ ] All tests that previously mocked `lib/storage.ts` or `localStorage` for blacklist/history have been updated or deleted
- [ ] `npm test` passes with zero failures
- [ ] `npm run build` completes without errors or warnings related to deleted modules
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #7 (blacklist localStorage removed)
- Blocked by #8 (history localStorage removed)
- Blocked by #9 (Route Handler removed)
