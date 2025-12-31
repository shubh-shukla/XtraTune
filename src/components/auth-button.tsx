"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import Image from "next/image";

export function AuthButton() {
  const { data, status } = useSession();
  const user = data?.user;

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn(undefined, { callbackUrl: "/" })}>
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1 bg-secondary/70">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "user"}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs">
            <UserRound className="h-4 w-4" />
          </div>
        )}
        <div className="text-sm leading-tight">
          <p className="font-medium line-clamp-1">{user.name ?? "User"}</p>
          {user.email && <p className="text-muted-foreground text-xs line-clamp-1">{user.email}</p>}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}