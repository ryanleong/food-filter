import { redirect } from 'next/navigation';

/**
 * Root page — purely static safety-net.
 * The proxy middleware handles auth-based redirects from "/" before this
 * component ever renders, so this is only reached in edge cases (e.g. during
 * prerendering or if middleware is bypassed). Always send unauthenticated users
 * to /login; the middleware will forward authenticated users to /dashboard.
 */
export default function Home() {
  redirect('/login');
}
