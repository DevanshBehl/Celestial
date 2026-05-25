import { NetworkConfig, ChainFamily } from '@celestial/shared-types';

export async function fetchBalance(address: string, network: NetworkConfig): Promise<string> {
  try {
    if (network.family === ChainFamily.EVM) {
      const rpcUrl = network.rpcUrls[0];
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const wei = BigInt(data.result);
      const eth = Number(wei) / 1e18;
      return eth.toLocaleString('en-US', { maximumFractionDigits: 4 });
    } else if (network.family === ChainFamily.SVM) {
      const rpcUrl = network.rpcUrls[0];
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const lamports = data.result.value;
      const sol = lamports / 1e9;
      return sol.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
  } catch (err) {
    console.error('Failed to fetch balance:', err);
  }
  return '0.00';
}
