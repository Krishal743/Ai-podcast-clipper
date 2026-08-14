"use client";

import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { mockCompleteCheckout, type PriceId } from "~/actions/stripe";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { CREDITS_PER_PACK } from "~/lib/stripe";

const PACK_INFO: Record<
  PriceId,
  { title: string; price: string; description: string }
> = {
  small: {
    title: "Small Pack",
    price: "$9.99",
    description: "50 credits for occasional podcast creators",
  },
  medium: {
    title: "Medium Pack",
    price: "$24.99",
    description: "150 credits — best value for regular podcasters",
  },
  large: {
    title: "Large Pack",
    price: "$69.99",
    description: "500 credits for podcast studios and agencies",
  },
};

const VALID_PACKS: PriceId[] = ["small", "medium", "large"];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawPack = searchParams.get("pack");
  const pack = VALID_PACKS.includes(rawPack as PriceId)
    ? (rawPack as PriceId)
    : "small";

  const info = PACK_INFO[pack];

  const handlePay = async () => {
    try {
      setIsPaying(true);
      setError(null);
      await mockCompleteCheckout(pack);
      router.refresh();
    } catch (_error) {
      setError("There was a problem processing your payment. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <Badge variant="secondary">Test mode</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            {info.title} — {CREDITS_PER_PACK[pack]} credits, one-time purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{info.title}</p>
              <p className="text-muted-foreground text-sm">{info.description}</p>
            </div>
            <p className="text-2xl font-bold">{info.price}</p>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                defaultValue="4242 4242 4242 4242"
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Input id="expiry" defaultValue="12 / 34" readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" defaultValue="424" readOnly />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-500">
              {error}
            </p>
          )}

          <p className="bg-muted rounded-md p-3 text-xs leading-relaxed">
            Demo checkout — no real payment is processed. Stripe is not
            available in India, so this simulates a successful
            &quot;checkout.session.completed&quot; and instantly adds credits.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={handlePay}
            disabled={isPaying}
            type="button"
          >
            {isPaying
              ? "Processing..."
              : `Pay ${info.price} (demo)`}
          </Button>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <CheckIcon className="size-3" /> No real card is charged
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}