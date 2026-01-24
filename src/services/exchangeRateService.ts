// Exchange rate service with daily caching

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ExchangeRateCache {
  baseCurrency: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

/**
 * Get the suggested exchange rate for converting from one currency to another.
 * Uses a free public API with 24-hour caching.
 */
export async function getSuggestedExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return null;
  }

  try {
    // Check localStorage cache first
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const cache: ExchangeRateCache = JSON.parse(cachedData);
      const now = Date.now();
      
      // If cache is still valid (< 24 hours old) and has USD as base
      if (cache.baseCurrency === 'USD' && now - cache.fetchedAt < CACHE_DURATION_MS) {
        return calculateRate(cache.rates, fromCurrency, toCurrency);
      }
    }

    // Fetch fresh rates from API (using USD as base for simplicity)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Invalid API response');
    }

    // Cache the new rates
    const newCache: ExchangeRateCache = {
      baseCurrency: 'USD',
      rates: data.rates,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));

    return calculateRate(data.rates, fromCurrency, toCurrency);
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Calculate exchange rate from USD-based rates
 * Rate = (1 / fromRate) * toRate
 */
function calculateRate(
  rates: Record<string, number>,
  fromCurrency: string,
  toCurrency: string
): number | null {
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    return null;
  }

  // If fromCurrency is USD, just return the toRate
  if (fromCurrency === 'USD') {
    return toRate;
  }

  // If toCurrency is USD, return 1/fromRate
  if (toCurrency === 'USD') {
    return 1 / fromRate;
  }

  // Otherwise, convert through USD: (1/fromRate) * toRate
  return toRate / fromRate;
}

/**
 * Get the last time rates were fetched (for display purposes)
 */
export function getLastFetchTime(): Date | null {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const cache: ExchangeRateCache = JSON.parse(cachedData);
      return new Date(cache.fetchedAt);
    }
  } catch {
    // Ignore errors
  }
  return null;
}
