
'use server';
/**
 * @fileOverview Service for interacting with the OKX API (v5).
 *
 * This service encapsulates calls to the OKX DEX API for fetching
 * market data, token prices, etc.
 *
 * OKX API v5 Documentation: https://www.okx.com/docs-v5/en/
 * Authentication: https://www.okx.com/docs-v5/en/#overview-authentication
 */

import crypto from 'crypto';

const OKX_API_BASE_URL = 'https://www.okx.com';

interface OkxApiErrorResponse {
  code: string;
  msg: string;
  data: any[];
}

interface OkxTicker {
  instType: string;
  instId: string;
  last: string;
  lastSz: string;
  askPx: string;
  askSz: string;
  bidPx: string;
  bidSz: string;
  open24h: string;
  high24h: string;
  low24h: string;
  volCcy24h: string; // Volume in currency (e.g., USDT)
  vol24h: string;    // Volume in token (e.g., BTC)
  ts: string;
  sodUtc0: string;
  sodUtc8: string;
}


// Helper function to generate authentication headers for OKX API v5
const getOkxAuthHeaders = (method: string, requestPath: string, body?: string | object) => {
  const timestamp = new Date().toISOString();
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) {
    console.error('OKX_API_KEY, OKX_SECRET_KEY, or OKX_PASSPHRASE is not configured in .env');
    // This will cause API calls to fail if credentials are not set
    return null;
  }

  let bodyString = '';
  if (body) {
    if (typeof body === 'object') {
      bodyString = JSON.stringify(body);
    } else {
      bodyString = body;
    }
  }
  
  const signaturePayload = timestamp + method.toUpperCase() + requestPath + bodyString;
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signaturePayload)
    .digest('base64');

  return {
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
    'Content-Type': 'application/json',
  };
};

/**
 * Fetches a summary of current market conditions from OKX DEX.
 * It fetches ticker data for major pairs like BTC-USDT, ETH-USDT, and OKT-USDT.
 */
export async function fetchOkxMarketSummary(): Promise<string> {
  const pairsToFetch = ['BTC-USDT', 'ETH-USDT', 'OKT-USDT'];
  let summaryParts: string[] = [];

  try {
    for (const pair of pairsToFetch) {
      const requestPath = `/api/v5/market/ticker?instId=${pair}`;
      const authHeaders = getOkxAuthHeaders('GET', requestPath);

      if (!authHeaders) {
        return "OKX API credentials not configured. Cannot fetch market data.";
      }

      const response = await fetch(`${OKX_API_BASE_URL}${requestPath}`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json() as OkxApiErrorResponse;
        console.error(`OKX API Error for ${pair} (${requestPath}): ${response.status}`, errorData);
        summaryParts.push(`${pair}: Error fetching data (${errorData.msg || response.statusText})`);
        continue;
      }

      const result = await response.json();
      if (result.data && result.data.length > 0) {
        const ticker = result.data[0] as OkxTicker;
        const price = parseFloat(ticker.last).toFixed(2);
        const openPrice = parseFloat(ticker.open24h);
        const change = openPrice !== 0 ? ((parseFloat(ticker.last) - openPrice) / openPrice) * 100 : 0;
        summaryParts.push(`${ticker.instId} last price: ${price} USDT (24h Change: ${change.toFixed(2)}%, 24h Vol: ${parseFloat(ticker.volCcy24h).toLocaleString()} USDT)`);
      } else {
        summaryParts.push(`${pair}: No data found.`);
      }
    }

    if (summaryParts.length === 0) {
      return "Failed to fetch any market data from OKX.";
    }
    return `OKX DEX Real Data Snapshot: ${summaryParts.join('; ')}. Market conditions are dynamic.`;

  } catch (error: any) {
    console.error('Error fetching OKX market summary:', error);
    // Check if the error is due to fetch itself (e.g. network error)
    if (error.cause && error.cause.code === 'UND_ERR_CONNECT_TIMEOUT') {
        return 'Failed to connect to OKX API for market summary (Connection Timeout). Using fallback: Market is dynamic.';
    }
    return `Failed to connect to OKX API for market summary. Error: ${error.message || 'Unknown error'}. Using fallback: Market is dynamic.`;
  }
}

/**
 * Fetches the current USD price for a given token symbol from OKX.
 * Assumes the token is traded against USDT.
 */
export async function fetchTokenPriceFromOKX(tokenSymbol: string): Promise<number | null> {
  const normalizedSymbol = tokenSymbol.toUpperCase();
  if (normalizedSymbol === 'USDT' || normalizedSymbol === 'USDC') return 1.00; // Stablecoins

  const instId = `${normalizedSymbol}-USDT`;
  const requestPath = `/api/v5/market/ticker?instId=${instId}`;
  const authHeaders = getOkxAuthHeaders('GET', requestPath);

  if (!authHeaders) {
    console.error("OKX API credentials not configured. Cannot fetch token price.");
    return null;
  }

  try {
    const response = await fetch(`${OKX_API_BASE_URL}${requestPath}`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorData = await response.json() as OkxApiErrorResponse;
      console.error(`OKX Price API Error for ${instId} (${requestPath}): ${response.status}`, errorData);
      return null;
    }

    const result = await response.json();
    if (result.data && result.data.length > 0 && result.data[0].last) {
      return parseFloat(result.data[0].last);
    }
    console.warn(`No price data found for ${instId} on OKX.`);
    return null;
  } catch (error: any) {
    console.error(`Error fetching price for ${tokenSymbol} from OKX:`, error);
    return null;
  }
}
