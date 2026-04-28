"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      <Navbar />
      <main className={cn("flex-1 w-full", !isHomePage && "pt-28")}>
        {children}
      </main>
    </>
  );
}
