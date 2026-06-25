"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { ritualChain } from "@/lib/chain";
import { useState } from "react";

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  connectors: [injected(), walletConnect({ projectId: "22748db9d9949085e034adb7e4894393", showQrModal: true })],
  transports: {
    [ritualChain.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
