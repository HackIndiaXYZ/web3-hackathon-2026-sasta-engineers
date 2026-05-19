import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  alchemyApiKey: process.env.ALCHEMY_API_KEY,
  rpcUrl: process.env.ALCHEMY_RPC_URL,
  chainId: parseInt(process.env.CHAIN_ID, 10) || 80002, // Polygon Amoy testnet
  contractAddress: process.env.CONTRACT_ADDRESS,
  privateKey: process.env.PRIVATE_KEY,
  gasLimit: parseInt(process.env.GAS_LIMIT, 10) || 500000,
  maxGasPrice: process.env.MAX_GAS_PRICE || '100',
  confirmations: parseInt(process.env.CONFIRMATIONS, 10) || 2,
}));
