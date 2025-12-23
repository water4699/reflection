import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Encrypted Reflection Log',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [mainnet, sepolia, hardhat],
  ssr: false,
});

