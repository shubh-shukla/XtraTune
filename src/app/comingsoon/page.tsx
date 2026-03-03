import { Clock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Comingsoon() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
        <Clock className="h-8 w-8 text-primary" />
      </div>
      <h1 className="font-cal text-3xl">Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        We&apos;re working on something exciting. Stay tuned!
      </p>
      <Link href="/" className={buttonVariants({ variant: "default" })}>
        Go home
      </Link>
    </div>
  );
}
