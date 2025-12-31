import { cn } from "@/lib/utils";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main
      className={cn(
        "col-span-5 lg:col-span-9 main-layout px-4 pb-[120px] page-shell"
      )}
    >
      {children}
    </main>
  );
};
