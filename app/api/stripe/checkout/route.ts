import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const returnUrl = new URL(request.url).origin;

  const url = await createCheckoutSession({
    userId: user.id,
    userEmail: user.email!,
    returnUrl,
  });

  return Response.json({ url });
}
