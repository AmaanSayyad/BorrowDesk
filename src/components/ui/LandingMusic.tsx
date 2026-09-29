"use client";

import { MusicPlayer } from "@/components/ui/MusicPlayer";

/** Landing-only music shell. Do not mount on /app or other routes. */
export function LandingMusic() {
  return <MusicPlayer />;
}
