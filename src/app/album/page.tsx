import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function Albums() {
  return (
    <section className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="font-cal text-6xl text-center">Search for Album</h1>
      <Link href="/" className={buttonVariants({ className: "w-fit " })}>
        Go Back
      </Link>
    </section>
  );
}
