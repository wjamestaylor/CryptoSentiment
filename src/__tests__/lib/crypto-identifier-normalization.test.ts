/**
 * Integration tests for flexible crypto identifier normalization
 * Tests the end-to-end behavior of accepting symbols, names, and CoinGecko IDs
 */

import { normalizeCryptoIdentifier } from '@/lib/crypto-mappings';

describe('Crypto Identifier Normalization - Integration Tests', () => {
  describe('Bitcoin identifier variations', () => {
    const bitcoinId = 'bitcoin';
    
    it('should accept BTC symbol in any case', () => {
      expect(normalizeCryptoIdentifier('BTC')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('btc')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('Btc')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('bTc')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('bTC')).toBe(bitcoinId);
    });
    
    it('should accept bitcoin name in any case', () => {
      expect(normalizeCryptoIdentifier('bitcoin')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('Bitcoin')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('BITCOIN')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('BiTcOiN')).toBe(bitcoinId);
    });
    
    it('should handle whitespace around Bitcoin identifiers', () => {
      expect(normalizeCryptoIdentifier(' BTC ')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('  bitcoin  ')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('\tBTC\t')).toBe(bitcoinId);
      expect(normalizeCryptoIdentifier('\nbitcoin\n')).toBe(bitcoinId);
    });
  });

  describe('Ethereum identifier variations', () => {
    const ethereumId = 'ethereum';
    
    it('should accept ETH symbol in any case', () => {
      expect(normalizeCryptoIdentifier('ETH')).toBe(ethereumId);
      expect(normalizeCryptoIdentifier('eth')).toBe(ethereumId);
      expect(normalizeCryptoIdentifier('Eth')).toBe(ethereumId);
      expect(normalizeCryptoIdentifier('eTh')).toBe(ethereumId);
    });
    
    it('should accept ethereum name in any case', () => {
      expect(normalizeCryptoIdentifier('ethereum')).toBe(ethereumId);
      expect(normalizeCryptoIdentifier('Ethereum')).toBe(ethereumId);
      expect(normalizeCryptoIdentifier('ETHEREUM')).toBe(ethereumId);
    });
  });

  describe('Stablecoin identifier variations', () => {
    it('should handle USDT/Tether variations', () => {
      const tetherId = 'tether';
      expect(normalizeCryptoIdentifier('USDT')).toBe(tetherId);
      expect(normalizeCryptoIdentifier('usdt')).toBe(tetherId);
      expect(normalizeCryptoIdentifier('tether')).toBe(tetherId);
      expect(normalizeCryptoIdentifier('Tether')).toBe(tetherId);
      expect(normalizeCryptoIdentifier('TETHER')).toBe(tetherId);
    });
    
    it('should handle USDC/USD Coin variations', () => {
      const usdcId = 'usd-coin';
      expect(normalizeCryptoIdentifier('USDC')).toBe(usdcId);
      expect(normalizeCryptoIdentifier('usdc')).toBe(usdcId);
      expect(normalizeCryptoIdentifier('usd-coin')).toBe(usdcId);
      expect(normalizeCryptoIdentifier('USD-Coin')).toBe(usdcId);
      expect(normalizeCryptoIdentifier('USD-COIN')).toBe(usdcId);
    });
  });

  describe('Complex CoinGecko IDs with hyphens', () => {
    it('should handle multi-word CoinGecko IDs', () => {
      expect(normalizeCryptoIdentifier('bitcoin-cash')).toBe('bitcoin-cash');
      expect(normalizeCryptoIdentifier('Bitcoin-Cash')).toBe('bitcoin-cash');
      expect(normalizeCryptoIdentifier('BITCOIN-CASH')).toBe('bitcoin-cash');
    });
    
    it('should handle compound token names', () => {
      expect(normalizeCryptoIdentifier('compound-governance-token')).toBe('compound-governance-token');
      expect(normalizeCryptoIdentifier('Compound-Governance-Token')).toBe('compound-governance-token');
    });
    
    it('should handle IDs with numbers', () => {
      expect(normalizeCryptoIdentifier('avalanche-2')).toBe('avalanche-2');
      expect(normalizeCryptoIdentifier('Avalanche-2')).toBe('avalanche-2');
      expect(normalizeCryptoIdentifier('AVALANCHE-2')).toBe('avalanche-2');
    });
  });

  describe('Symbol priority over CoinGecko ID', () => {
    it('should prioritize symbol lookup when both exist', () => {
      // BTC as a symbol should return 'bitcoin', not treat 'BTC' as a CoinGecko ID
      expect(normalizeCryptoIdentifier('BTC')).toBe('bitcoin');
      expect(normalizeCryptoIdentifier('btc')).toBe('bitcoin');
      
      // But 'bitcoin' as a CoinGecko ID should still work
      expect(normalizeCryptoIdentifier('bitcoin')).toBe('bitcoin');
    });
  });

  describe('Error cases and invalid inputs', () => {
    it('should return null for unknown cryptocurrencies', () => {
      expect(normalizeCryptoIdentifier('UNKNOWN')).toBeNull();
      expect(normalizeCryptoIdentifier('fake-coin')).toBeNull();
      expect(normalizeCryptoIdentifier('not-a-crypto')).toBeNull();
    });
    
    it('should return null for empty or whitespace-only input', () => {
      expect(normalizeCryptoIdentifier('')).toBeNull();
      expect(normalizeCryptoIdentifier(' ')).toBeNull();
      expect(normalizeCryptoIdentifier('  ')).toBeNull();
      expect(normalizeCryptoIdentifier('\t')).toBeNull();
      expect(normalizeCryptoIdentifier('\n')).toBeNull();
    });
    
    it('should return null for invalid input types', () => {
      expect(normalizeCryptoIdentifier(null as unknown as string)).toBeNull();
      expect(normalizeCryptoIdentifier(undefined as unknown as string)).toBeNull();
    });
    
    it('should return null for special characters and invalid formats', () => {
      expect(normalizeCryptoIdentifier('BTC-USD')).toBeNull();
      expect(normalizeCryptoIdentifier('ETH/USD')).toBeNull();
      expect(normalizeCryptoIdentifier('@#$%')).toBeNull();
      expect(normalizeCryptoIdentifier('123456')).toBeNull();
    });
  });

  describe('Real-world user input scenarios', () => {
    it('should handle copy-pasted input with extra whitespace', () => {
      expect(normalizeCryptoIdentifier('  BTC  ')).toBe('bitcoin');
      expect(normalizeCryptoIdentifier('\tbitcoin\t')).toBe('bitcoin');
    });
    
    it('should handle mixed case from mobile keyboard', () => {
      expect(normalizeCryptoIdentifier('Btc')).toBe('bitcoin');
      expect(normalizeCryptoIdentifier('Eth')).toBe('ethereum');
      expect(normalizeCryptoIdentifier('Usdt')).toBe('tether');
    });
    
    it('should handle all caps input', () => {
      expect(normalizeCryptoIdentifier('BITCOIN')).toBe('bitcoin');
      expect(normalizeCryptoIdentifier('ETHEREUM')).toBe('ethereum');
    });
    
    it('should handle various popular cryptocurrencies', () => {
      expect(normalizeCryptoIdentifier('SOL')).toBe('solana');
      expect(normalizeCryptoIdentifier('solana')).toBe('solana');
      expect(normalizeCryptoIdentifier('Solana')).toBe('solana');
      
      expect(normalizeCryptoIdentifier('ADA')).toBe('cardano');
      expect(normalizeCryptoIdentifier('cardano')).toBe('cardano');
      expect(normalizeCryptoIdentifier('Cardano')).toBe('cardano');
      
      expect(normalizeCryptoIdentifier('DOT')).toBe('polkadot');
      expect(normalizeCryptoIdentifier('polkadot')).toBe('polkadot');
      expect(normalizeCryptoIdentifier('Polkadot')).toBe('polkadot');
    });
  });

  describe('Consistency across all supported cryptocurrencies', () => {
    it('should normalize all symbols consistently', () => {
      const testCases = [
        { symbol: 'BNB', id: 'binancecoin' },
        { symbol: 'XRP', id: 'ripple' },
        { symbol: 'DOGE', id: 'dogecoin' },
        { symbol: 'MATIC', id: 'matic-network' },
        { symbol: 'LINK', id: 'chainlink' },
        { symbol: 'UNI', id: 'uniswap' },
        { symbol: 'AVAX', id: 'avalanche-2' },
        { symbol: 'LTC', id: 'litecoin' },
        { symbol: 'BCH', id: 'bitcoin-cash' },
      ];
      
      testCases.forEach(({ symbol, id }) => {
        expect(normalizeCryptoIdentifier(symbol)).toBe(id);
        expect(normalizeCryptoIdentifier(symbol.toLowerCase())).toBe(id);
        expect(normalizeCryptoIdentifier(id)).toBe(id);
        expect(normalizeCryptoIdentifier(id.toUpperCase())).toBe(id);
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle shortest valid symbols', () => {
      expect(normalizeCryptoIdentifier('OP')).toBe('optimism');
    });
    
    it('should handle longest valid symbols', () => {
      // COMP is compound-governance-token
      expect(normalizeCryptoIdentifier('COMP')).toBe('compound-governance-token');
    });
    
    it('should handle IDs with multiple hyphens', () => {
      expect(normalizeCryptoIdentifier('compound-governance-token')).toBe('compound-governance-token');
      expect(normalizeCryptoIdentifier('Compound-Governance-Token')).toBe('compound-governance-token');
    });
  });
});
