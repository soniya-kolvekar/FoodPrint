"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAnimaTheme = pathname === "/substitutes" || pathname === "/expiry-heatmap";

  if (isAnimaTheme) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 flex-1 w-full">{children}</main>
    </>
  );
}
