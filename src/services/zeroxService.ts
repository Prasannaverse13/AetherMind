
'use server';

/**
 * @fileOverview Service for interacting with the 0x.org API.
 *
 * This service encapsulates calls to the 0x API for fetching gasless quotes.
 * 0x API Docs: https://0x.org/docs/
 */

const ZEROX_API_BASE_URL = 'https://api.0x.org';

interface ZeroExQuoteParams {
  chainId: number | string;
  sellToken: string;
  buyToken: string;
  sellAmount?: string; // Either sellAmount or buyAmount must be provided
  buyAmount?: string;
  takerAddress?: string; // Optional but recommended for more accurate quotes
  // Add other potential 0x API params as needed, e.g., slippageTolerance
}

interface ZeroExQuoteResponse {
  // Define the expected structure based on 0x API docs
  // This is a simplified example; consult 0x docs for the full response
  chainId: number;
  price: string;
  guaranteedPrice: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  sources: Array<{ name: string; proportion: string }>;
  allowanceTarget?: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  // ... and other fields
}

interface ZeroExApiError {
  code: number;
  reason: string;
  validationErrors?: Array<{
    field: string;
    code: string;
    reason: string;
    description?: string;
  }>;
}

interface FetchGaslessQuoteResult {
  quote?: ZeroExQuoteResponse;
  error?: string;
  errorDetails?: ZeroExApiError;
}

export async function fetchGaslessQuote(
  params: ZeroExQuoteParams
): Promise<FetchGaslessQuoteResult> {
  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    console.error('ZEROX_API_KEY is not configured in .env');
    return { error: '0x API key not configured. Cannot fetch gasless quote.' };
  }

  const queryParams = new URLSearchParams({
    chainId: String(params.chainId),
    sellToken: params.sellToken,
    buyToken: params.buyToken,
  });

  if (params.sellAmount) {
    queryParams.append('sellAmount', params.sellAmount);
  } else if (params.buyAmount) {
    queryParams.append('buyAmount', params.buyAmount);
  } else {
    return { error: 'Either sellAmount or buyAmount must be provided for a 0x quote.' };
  }

  if (params.takerAddress) {
    queryParams.append('takerAddress', params.takerAddress);
  }
  // Potentially add other params like 'slippagePercentage' if needed

  const requestUrl = `${ZEROX_API_BASE_URL}/gasless/quote?${queryParams.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        '0x-api-key': apiKey,
        '0x-version': 'v2', // As per user's curl example
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorPayload = responseData as ZeroExApiError;
      console.error(
        `0x API Error (${requestUrl}): ${response.status} ${response.statusText}`,
        errorPayload
      );
      return {
        error: `Failed to fetch gasless quote from 0x API: ${errorPayload.reason || response.statusText}`,
        errorDetails: errorPayload,
      };
    }

    return { quote: responseData as ZeroExQuoteResponse };
  } catch (error: any) {
    console.error('Error fetching 0x gasless quote:', error);
    return {
      error: `Failed to connect to 0x API for gasless quote. Error: ${error.message || 'Unknown error'}`,
    };
  }
}
 