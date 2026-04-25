import { stripe } from '../../../../lib/stripe';
import { supabase } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RightWords Pro',
              description: 'Unlimited access to both tools + full session history',
            },
            unit_amount: 799, // $7.99
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=true`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
