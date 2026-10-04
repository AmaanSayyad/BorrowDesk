"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stopSharedMusic } from "@/components/ui/MusicPlayer";

/**
 * Ensures music never runs off the marketing home page -
 * including client navigations and hard refreshes on /app/*.
 */
export function MusicRouteGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") return;
    stopSharedMusic();
  }, [pathname]);

  return null;
}
