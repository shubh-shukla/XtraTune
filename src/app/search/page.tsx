import Link from "next/link";
import { Balancer } from "react-wrap-balancer";
import { buttonVariants } from "@/components/ui/button";

export default async function searchpage() {
  return (
    <section className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="font-cal text-6xl text-center">
        <Balancer>Search for Album/Songs</Balancer>
      </h1>
      <Link href="/" className={buttonVariants({ className: "w-fit " })}>
        Go Back
      </Link>
    </section>
  );
}
