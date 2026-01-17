"use client";
import { ReactNode } from "react";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import "@coinbase/onchainkit/styles.css";

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider>
      {children}
    </MiniKitProvider>
  );
}
