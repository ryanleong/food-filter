import { redirect } from 'next/navigation';

// The middleware handles auth-based redirects from `/`.
// This server component acts as a safety net for any direct hits.
export default function Home() {
  redirect('/login');
}
