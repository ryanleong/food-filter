import { Suspense } from 'react';
import LoginClient from './LoginClient';

/**
 * Login page — server component shell.
 * LoginClient uses useSearchParams(), which requires a Suspense boundary
 * when cacheComponents is enabled (route segment `dynamic` config is incompatible).
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
