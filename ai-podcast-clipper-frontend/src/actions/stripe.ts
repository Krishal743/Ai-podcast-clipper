"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { env } from "~/env";
import { CREDITS_PER_PACK, isMockStripe, type PriceId } from "~/lib/stripe";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export type { PriceId } from "~/lib/stripe";

const PRICE_IDS: Record<PriceId, string> = {
  small: env.STRIPE_SMALL_CREDIT_PACK,
  medium: env.STRIPE_MEDIUM_CREDIT_PACK,
  large: env.STRIPE_LARGE_CREDIT_PACK,
};

export async function createCheckoutSession(priceId: PriceId) {
  const serverSession = await auth();

  const user = await db.user.findUniqueOrThrow({
    where: {
      id: serverSession?.user.id,
    },
    select: { stripeCustomerId: true },
  });

  if (isMockStripe()) {
    redirect(`/dashboard/billing/checkout?pack=${priceId}`);
  }

  if (!user.stripeCustomerId) {
    throw new Error("User has no stripeCustomerId");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: PRICE_IDS[priceId], quantity: 1 }],
    customer: user.stripeCustomerId,
    mode: "payment",
    success_url: `${env.BASE_URL}/dashboard?success=true`,
  });

  if (!session.url) {
    throw new Error("Failed to create session URL");
  }

  redirect(session.url);
}

export async function mockCompleteCheckout(priceId: PriceId) {
  if (!isMockStripe()) {
    throw new Error("Mock checkout is disabled");
  }

  const serverSession = await auth();

  const user = await db.user.findUniqueOrThrow({
    where: {
      id: serverSession?.user.id,
    },
    select: { id: true },
  });

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      credits: {
        increment: CREDITS_PER_PACK[priceId],
      },
    },
  });

  redirect("/dashboard?success=true");
}