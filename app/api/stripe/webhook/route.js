import { stripe } from '../../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({
          is_pro: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await supabaseAdmin
      .from('profiles')
      .update({ is_pro: false })
      .eq('stripe_subscription_id', subscription.id);
  }

  return Response.json({ received: true });
}
