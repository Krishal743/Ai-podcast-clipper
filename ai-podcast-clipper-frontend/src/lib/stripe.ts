import { env } from "~/env";

export type PriceId = "small" | "medium" | "large";

export const CREDITS_PER_PACK: Record<PriceId, number> = {
  small: 50,
  medium: 150,
  large: 500,
};

export function isMockStripe() {
  return (
    env.STRIPE_MODE === "mock" ||
    env.STRIPE_SECRET_KEY.startsWith("sk_test_placeholder") ||
    env.STRIPE_SECRET_KEY.startsWith("sk_live_placeholder")
  );
}