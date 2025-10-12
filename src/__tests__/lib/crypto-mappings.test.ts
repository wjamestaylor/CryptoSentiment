import {
  SYMBOL_TO_COINGECKO_ID,
  getCoinGeckoId,
  getSymbolFromCoinGeckoId,
  hasKnownMapping,
} from '@/lib/crypto-mappings';

describe('crypto-mappings', () => {
  describe('SYMBOL_TO_COINGECKO_ID', () => {
    it('should contain major cryptocurrencies', () => {
      expect(SYMBOL_TO_COINGECKO_ID['BTC']).toBe('bitcoin');
      expect(SYMBOL_TO_COINGECKO_ID['ETH']).toBe('ethereum');
      expect(SYMBOL_TO_COINGECKO_ID['BNB']).toBe('binancecoin');
      expect(SYMBOL_TO_COINGECKO_ID['XRP']).toBe('ripple');
      expect(SYMBOL_TO_COINGECKO_ID['ADA']).toBe('cardano');
    });

    it('should contain privacy coins', () => {
      expect(SYMBOL_TO_COINGECKO_ID['XMR']).toBe('monero');
      expect(SYMBOL_TO_COINGECKO_ID['ZEC']).toBe('zcash');
      expect(SYMBOL_TO_COINGECKO_ID['DASH']).toBe('dash');
    });

    it('should contain DeFi tokens', () => {
      expect(SYMBOL_TO_COINGECKO_ID['UNI']).toBe('uniswap');
      expect(SYMBOL_TO_COINGECKO_ID['LINK']).toBe('chainlink');
      expect(SYMBOL_TO_COINGECKO_ID['AAVE']).toBe('aave');
      expect(SYMBOL_TO_COINGECKO_ID['MKR']).toBe('maker');
      expect(SYMBOL_TO_COINGECKO_ID['COMP']).toBe('compound-governance-token');
    });

    it('should contain Layer 2 tokens', () => {
      expect(SYMBOL_TO_COINGECKO_ID['MATIC']).toBe('matic-network');
      expect(SYMBOL_TO_COINGECKO_ID['OP']).toBe('optimism');
      expect(SYMBOL_TO_COINGECKO_ID['ARB']).toBe('arbitrum');
    });

    it('should contain meme coins', () => {
      expect(SYMBOL_TO_COINGECKO_ID['SHIB']).toBe('shiba-inu');
      expect(SYMBOL_TO_COINGECKO_ID['PEPE']).toBe('pepe');
      expect(SYMBOL_TO_COINGECKO_ID['FLOKI']).toBe('floki');
    });

    it('should contain stablecoins', () => {
      expect(SYMBOL_TO_COINGECKO_ID['USDT']).toBe('tether');
      expect(SYMBOL_TO_COINGECKO_ID['USDC']).toBe('usd-coin');
      expect(SYMBOL_TO_COINGECKO_ID['BUSD']).toBe('binance-usd');
      expect(SYMBOL_TO_COINGECKO_ID['DAI']).toBe('dai');
    });

    it('should contain other popular cryptocurrencies', () => {
      expect(SYMBOL_TO_COINGECKO_ID['DOT']).toBe('polkadot');
      expect(SYMBOL_TO_COINGECKO_ID['ATOM']).toBe('cosmos');
      expect(SYMBOL_TO_COINGECKO_ID['NEAR']).toBe('near');
      expect(SYMBOL_TO_COINGECKO_ID['LTC']).toBe('litecoin');
      expect(SYMBOL_TO_COINGECKO_ID['BCH']).toBe('bitcoin-cash');
    });

    it('should contain all expected cryptocurrency symbols', () => {
      const expectedSymbols = [
        'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'TRX', 'TON', 'AVAX',
        'XMR', 'ZEC', 'DASH',
        'UNI', 'LINK', 'AAVE', 'MKR', 'COMP', 'SUSHI',
        'MATIC', 'OP', 'ARB',
        'SHIB', 'PEPE', 'FLOKI',
        'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD',
        'DOT', 'ATOM', 'NEAR', 'ALGO', 'VET', 'THETA', 'FTM', 'ICP', 'HBAR',
        'FIL', 'LTC', 'BCH', 'ETC', 'XLM', 'APT', 'SUI', 'INJ', 'SEI', 'TIA',
        'ORDI', 'STX', 'KAS', 'RNDR', 'GRT', 'SAND', 'MANA', 'AXS', 'CHZ',
        'APE', 'LDO', 'CRV', 'GMT'
      ];

      expectedSymbols.forEach(symbol => {
        expect(SYMBOL_TO_COINGECKO_ID).toHaveProperty(symbol);
        expect(typeof SYMBOL_TO_COINGECKO_ID[symbol]).toBe('string');
        expect(SYMBOL_TO_COINGECKO_ID[symbol].length).toBeGreaterThan(0);
      });
    });

    it('should have unique CoinGecko IDs', () => {
      const coinGeckoIds = Object.values(SYMBOL_TO_COINGECKO_ID);
      const uniqueIds = new Set(coinGeckoIds);
      expect(uniqueIds.size).toBe(coinGeckoIds.length);
    });

    it('should have valid CoinGecko ID format', () => {
      Object.values(SYMBOL_TO_COINGECKO_ID).forEach(id => {
        // CoinGecko IDs are typically lowercase with hyphens
        expect(id).toMatch(/^[a-z0-9-]+$/);
        expect(id).not.toMatch(/^-|-$/); // Should not start or end with hyphen
        expect(id).not.toMatch(/--/); // Should not have consecutive hyphens
      });
    });
  });

  describe('getCoinGeckoId', () => {
    it('should return correct CoinGecko ID for valid symbols', () => {
      expect(getCoinGeckoId('BTC')).toBe('bitcoin');
      expect(getCoinGeckoId('ETH')).toBe('ethereum');
      expect(getCoinGeckoId('USDT')).toBe('tether');
      expect(getCoinGeckoId('DOT')).toBe('polkadot');
    });

    it('should handle lowercase symbols', () => {
      expect(getCoinGeckoId('btc')).toBe('bitcoin');
      expect(getCoinGeckoId('eth')).toBe('ethereum');
      expect(getCoinGeckoId('usdt')).toBe('tether');
    });

    it('should handle mixed case symbols', () => {
      expect(getCoinGeckoId('Btc')).toBe('bitcoin');
      expect(getCoinGeckoId('EtH')).toBe('ethereum');
      expect(getCoinGeckoId('UsDt')).toBe('tether');
    });

    it('should return null for unknown symbols', () => {
      expect(getCoinGeckoId('UNKNOWN')).toBeNull();
      expect(getCoinGeckoId('FAKE')).toBeNull();
      expect(getCoinGeckoId('NOTREAL')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getCoinGeckoId('')).toBeNull();
    });

    it('should return null for whitespace', () => {
      expect(getCoinGeckoId(' ')).toBeNull();
      expect(getCoinGeckoId('  ')).toBeNull();
      expect(getCoinGeckoId('\t')).toBeNull();
    });

    it('should handle symbols with trailing whitespace', () => {
      expect(getCoinGeckoId('BTC ')).toBeNull(); // Note: this will be null because 'BTC ' !== 'BTC'
      expect(getCoinGeckoId(' BTC')).toBeNull();
    });

    it('should work for all mapped symbols', () => {
      Object.keys(SYMBOL_TO_COINGECKO_ID).forEach(symbol => {
        const result = getCoinGeckoId(symbol);
        expect(result).toBe(SYMBOL_TO_COINGECKO_ID[symbol]);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('getSymbolFromCoinGeckoId', () => {
    it('should return correct symbol for valid CoinGecko IDs', () => {
      expect(getSymbolFromCoinGeckoId('bitcoin')).toBe('BTC');
      expect(getSymbolFromCoinGeckoId('ethereum')).toBe('ETH');
      expect(getSymbolFromCoinGeckoId('tether')).toBe('USDT');
      expect(getSymbolFromCoinGeckoId('polkadot')).toBe('DOT');
    });

    it('should return null for unknown CoinGecko IDs', () => {
      expect(getSymbolFromCoinGeckoId('unknown-coin')).toBeNull();
      expect(getSymbolFromCoinGeckoId('fake-token')).toBeNull();
      expect(getSymbolFromCoinGeckoId('not-real')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getSymbolFromCoinGeckoId('')).toBeNull();
    });

    it('should return null for whitespace', () => {
      expect(getSymbolFromCoinGeckoId(' ')).toBeNull();
      expect(getSymbolFromCoinGeckoId('  ')).toBeNull();
    });

    it('should be case sensitive for CoinGecko IDs', () => {
      expect(getSymbolFromCoinGeckoId('Bitcoin')).toBeNull(); // Should be lowercase
      expect(getSymbolFromCoinGeckoId('BITCOIN')).toBeNull();
      expect(getSymbolFromCoinGeckoId('bitcoin')).toBe('BTC');
    });

    it('should work for all mapped CoinGecko IDs', () => {
      Object.entries(SYMBOL_TO_COINGECKO_ID).forEach(([symbol, coinGeckoId]) => {
        const result = getSymbolFromCoinGeckoId(coinGeckoId);
        expect(result).toBe(symbol);
        expect(result).not.toBeNull();
      });
    });

    it('should handle complex CoinGecko IDs with hyphens', () => {
      expect(getSymbolFromCoinGeckoId('compound-governance-token')).toBe('COMP');
      expect(getSymbolFromCoinGeckoId('the-open-network')).toBe('TON');
      expect(getSymbolFromCoinGeckoId('avalanche-2')).toBe('AVAX');
      expect(getSymbolFromCoinGeckoId('matic-network')).toBe('MATIC');
    });

    it('should handle unique mappings correctly', () => {
      // Test some specific mappings that might be tricky
      expect(getSymbolFromCoinGeckoId('binancecoin')).toBe('BNB');
      expect(getSymbolFromCoinGeckoId('usd-coin')).toBe('USDC');
      expect(getSymbolFromCoinGeckoId('bitcoin-cash')).toBe('BCH');
      expect(getSymbolFromCoinGeckoId('ethereum-classic')).toBe('ETC');
    });
  });

  describe('hasKnownMapping', () => {
    it('should return true for valid symbols', () => {
      expect(hasKnownMapping('BTC')).toBe(true);
      expect(hasKnownMapping('ETH')).toBe(true);
      expect(hasKnownMapping('USDT')).toBe(true);
      expect(hasKnownMapping('DOT')).toBe(true);
    });

    it('should handle lowercase symbols', () => {
      expect(hasKnownMapping('btc')).toBe(true);
      expect(hasKnownMapping('eth')).toBe(true);
      expect(hasKnownMapping('usdt')).toBe(true);
    });

    it('should handle mixed case symbols', () => {
      expect(hasKnownMapping('Btc')).toBe(true);
      expect(hasKnownMapping('EtH')).toBe(true);
      expect(hasKnownMapping('UsDt')).toBe(true);
    });

    it('should return false for unknown symbols', () => {
      expect(hasKnownMapping('UNKNOWN')).toBe(false);
      expect(hasKnownMapping('FAKE')).toBe(false);
      expect(hasKnownMapping('NOTREAL')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasKnownMapping('')).toBe(false);
    });

    it('should return false for whitespace', () => {
      expect(hasKnownMapping(' ')).toBe(false);
      expect(hasKnownMapping('  ')).toBe(false);
      expect(hasKnownMapping('\t')).toBe(false);
    });

    it('should return false for symbols with whitespace', () => {
      expect(hasKnownMapping('BTC ')).toBe(false);
      expect(hasKnownMapping(' BTC')).toBe(false);
      expect(hasKnownMapping(' BTC ')).toBe(false);
    });

    it('should work for all mapped symbols', () => {
      Object.keys(SYMBOL_TO_COINGECKO_ID).forEach(symbol => {
        expect(hasKnownMapping(symbol)).toBe(true);
        expect(hasKnownMapping(symbol.toLowerCase())).toBe(true);
      });
    });

    it('should handle edge cases', () => {
      expect(hasKnownMapping('123')).toBe(false);
      expect(hasKnownMapping('!@#')).toBe(false);
      expect(hasKnownMapping('BTC-USD')).toBe(false);
      expect(hasKnownMapping('ETH/USD')).toBe(false);
    });
  });

  describe('bidirectional mapping consistency', () => {
    it('should maintain consistency between symbol and CoinGecko ID mappings', () => {
      Object.entries(SYMBOL_TO_COINGECKO_ID).forEach(([symbol, coinGeckoId]) => {
        // Forward mapping
        expect(getCoinGeckoId(symbol)).toBe(coinGeckoId);
        
        // Reverse mapping
        expect(getSymbolFromCoinGeckoId(coinGeckoId)).toBe(symbol);
        
        // Existence check
        expect(hasKnownMapping(symbol)).toBe(true);
      });
    });

    it('should handle round-trip conversions', () => {
      const testSymbols = ['BTC', 'ETH', 'USDT', 'DOT', 'LINK', 'UNI'];
      
      testSymbols.forEach(symbol => {
        const coinGeckoId = getCoinGeckoId(symbol);
        expect(coinGeckoId).not.toBeNull();
        
        if (coinGeckoId) {
          const backToSymbol = getSymbolFromCoinGeckoId(coinGeckoId);
          expect(backToSymbol).toBe(symbol);
        }
      });
    });
  });

  describe('data integrity', () => {
    it('should have reasonable number of mappings', () => {
      const mappingCount = Object.keys(SYMBOL_TO_COINGECKO_ID).length;
      expect(mappingCount).toBeGreaterThan(50); // Should have substantial mappings
      expect(mappingCount).toBeLessThan(200); // But not unreasonably many
    });

    it('should have consistent symbol format', () => {
      Object.keys(SYMBOL_TO_COINGECKO_ID).forEach(symbol => {
        // Symbols should be uppercase and alphanumeric
        expect(symbol).toMatch(/^[A-Z0-9]+$/);
        expect(symbol.length).toBeGreaterThan(1);
        expect(symbol.length).toBeLessThan(10); // Most crypto symbols are 2-6 chars
      });
    });

    it('should not have duplicate symbols', () => {
      const symbols = Object.keys(SYMBOL_TO_COINGECKO_ID);
      const uniqueSymbols = new Set(symbols);
      expect(uniqueSymbols.size).toBe(symbols.length);
    });
  });
});