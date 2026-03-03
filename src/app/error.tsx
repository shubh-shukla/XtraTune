"use client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="font-cal text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Please try again or head back home.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
