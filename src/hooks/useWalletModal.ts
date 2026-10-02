"use client";

import { useAppKit } from "@reown/appkit/react";
import { useCallback } from "react";

/** Open Reown AppKit connect / account modal */
export function useWalletModal() {
  const { open } = useAppKit();

  const openConnect = useCallback(() => {
    void open({ view: "Connect" });
  }, [open]);

  const openAccount = useCallback(() => {
    void open({ view: "Account" });
  }, [open]);

  return { openConnect, openAccount, open };
}
