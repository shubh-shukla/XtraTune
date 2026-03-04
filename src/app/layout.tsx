import dynamic from "next/dynamic";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { AuthProvider } from "@/components/providers/auth";
import { MainLayout } from "@/components/providers/layout";
// import { PWAProvider } from "@/components/providers/pwa";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { Provider } from "@/components/providers/theme";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";

const SearchBox = dynamic(
  () => import("@/components/searchBox").then((m) => ({ default: m.SearchBox })),
  { ssr: false },
);

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Font files can be colocated inside of `pages`
const fontHeading = localFont({
  src: "../../assets/fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "XtraTune",
  description: "A younicorn project built with NextJS ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XtraTune",
  },
  authors: [
    {
      name: "Shubham Shukla",
      url: "https://github.com/shubh-shukla",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground font-sans subpixel-antialiased min-height-screen",
          fontSans.variable,
          fontHeading.variable,
        )}
      >
        <AuthProvider>
          <ReduxProvider>
            <Provider>
              <div className="md:grid grid-cols-7 lg:grid-cols-11 min-height-screen">
                <Sidebar />
                <MainLayout>
                  <div className=" z-50 pb-5 bg-background sm:bg-transparent standalone:fixed top-0 left-0 right-0 px-5  sm:static ">
                    <Header />
                    <SearchBox className="sm:hidden flex-1 w-full mt-4 " />
                  </div>
                  <div className="grow standalone:mt-28 sm:mt-0 pb-[110px] md:pb-0">{children}</div>
                </MainLayout>
              </div>
              <MobileNav />
              {/* <PWAProvider /> */}
            </Provider>
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
