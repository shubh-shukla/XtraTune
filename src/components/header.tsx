import Link from "next/link";
import { AuthButton } from "./auth-button";
import { ModeToggle } from "./change-mode";
import { Icons } from "./icons";
import { SearchBox } from "./searchBox";

export const Header = () => {
  return (
    <header className="flex items-center justify-between pt-4 gap-x-3 lg:pr-0">
      <Link href="/" className="flex md:hidden justify-start gap-1.5 items-center">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow shadow-orange-500/20">
          <Icons.xtratune size={16} />
        </div>
        <p className="text-lg font-cal text-foreground">XtraTune</p>
      </Link>
      <SearchBox className="hidden sm:block flex-1 w-full" />
      <div className="flex items-center gap-3">
        <AuthButton />
        <ModeToggle />
      </div>
    </header>
  );
};
