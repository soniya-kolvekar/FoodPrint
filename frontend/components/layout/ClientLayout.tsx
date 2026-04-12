"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-28 flex-1 w-full">{children}</main>
    </>
  );
}
