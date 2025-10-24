/**
 * Mapping between cryptocurrency symbols and CoinGecko API IDs
 * This is needed because CoinGecko uses specific IDs like "monero" instead of symbols like "XMR"
 */
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  // Major cryptocurrencies
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'SOL': 'solana',
  'TRX': 'tron',
  'TON': 'the-open-network',
  'AVAX': 'avalanche-2',
  
  // Privacy coins
  'XMR': 'monero',
  'ZEC': 'zcash',
  'DASH': 'dash',
  
  // DeFi tokens
  'UNI': 'uniswap',
  'LINK': 'chainlink',
  'AAVE': 'aave',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  'SUSHI': 'sushi',
  
  // Layer 2s
  'MATIC': 'matic-network',
  'OP': 'optimism',
  'ARB': 'arbitrum',
  
  // Meme coins
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  
  // Stablecoins
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'DAI': 'dai',
  'TUSD': 'true-usd',
  
  // Other popular cryptocurrencies
  'DOT': 'polkadot',
  'ATOM': 'cosmos',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'THETA': 'theta-token',
  'FTM': 'fantom',
  'ICP': 'internet-computer',
  'HBAR': 'hedera-hashgraph',
  'FIL': 'filecoin',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar',
  'APT': 'aptos',
  'SUI': 'sui',
  'INJ': 'injective-protocol',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'ORDI': 'ordinals',
  'STX': 'blockstack',
  'KAS': 'kaspa',
  'RNDR': 'render-token',
  'GRT': 'the-graph',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'CHZ': 'chiliz',
  'APE': 'apecoin',
  'LDO': 'lido-dao',
  'CRV': 'curve-dao-token',
  'GMT': 'stepn',
};

/**
 * Get CoinGecko ID from cryptocurrency symbol
 */
export function getCoinGeckoId(symbol: string): string | null {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || null;
}

/**
 * Get symbol from CoinGecko ID
 */
export function getSymbolFromCoinGeckoId(coinGeckoId: string): string | null {
  const entry = Object.entries(SYMBOL_TO_COINGECKO_ID).find(([, id]) => id === coinGeckoId);
  return entry ? entry[0] : null;
}

/**
 * Check if a symbol has a known CoinGecko mapping
 */
export function hasKnownMapping(symbol: string): boolean {
  return symbol.toUpperCase() in SYMBOL_TO_COINGECKO_ID;
}

/**
 * Normalize crypto identifier (symbol, name, or CoinGecko ID) to CoinGecko ID
 * Accepts:
 * - Symbols: "BTC", "btc", "Bitcoin"
 * - CoinGecko IDs: "bitcoin", "Bitcoin"
 * - Mixed case: "BtC", "BiTcOiN"
 * 
 * Returns the CoinGecko ID or null if not found
 */
export function normalizeCryptoIdentifier(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmedInput = input.trim();
  
  if (trimmedInput.length === 0) {
    return null;
  }

  // Convert to lowercase for case-insensitive comparison
  const lowerInput = trimmedInput.toLowerCase();
  
  // First, try as a symbol (e.g., "BTC", "btc", "Bitcoin")
  const fromSymbol = getCoinGeckoId(trimmedInput);
  if (fromSymbol) {
    return fromSymbol;
  }

  // Check if it's already a valid CoinGecko ID by looking in the values
  const coinGeckoIds = Object.values(SYMBOL_TO_COINGECKO_ID);
  const matchingId = coinGeckoIds.find(id => id.toLowerCase() === lowerInput);
  if (matchingId) {
    return matchingId;
  }

  // Not found
  return null;
}