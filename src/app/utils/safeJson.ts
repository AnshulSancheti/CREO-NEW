/**
 * Safe JSON response handler
 * Prevents "Unexpected end of JSON input" errors
 */

export type SafeJsonResult<T = any> = {
  ok: boolean;
  status: number;
  data?: T;
  raw: string;
  errorMessage?: string;
  traceId?: string;
};

/**
 * Safely parse a Response object to JSON
 * Never throws on empty body or invalid JSON
 */
export async function safeJson<T = any>(
  res: Response,
  endpoint?: string
): Promise<SafeJsonResult<T>> {
  const status = res.status;
  
  try {
    // Read response as text first (never throws)
    const raw = await res.text();
    
    // Handle empty response
    if (!raw || raw.trim().length === 0) {
      return {
        ok: false,
        status,
        raw: '',
        errorMessage: `Empty response from ${endpoint || 'server'} (status ${status})`
      };
    }
    
    // Try to parse JSON
    try {
      // Quick check if it looks like JSON
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(raw);
        
        // Extract traceId if present
        const traceId = parsed.traceId || parsed.data?.traceId;
        
        return {
          ok: res.ok && (parsed.success !== false),
          status,
          data: parsed,
          raw,
          traceId,
          errorMessage: parsed.error?.message || parsed.message
        };
      } else {
        // Not JSON - treat as plain text error
        return {
          ok: false,
          status,
          raw,
          errorMessage: `Non-JSON response: ${raw.substring(0, 200)}`
        };
      }
    } catch (parseError) {
      // JSON parse failed
      return {
        ok: false,
        status,
        raw,
        errorMessage: `Invalid JSON from ${endpoint || 'server'}: ${raw.substring(0, 200)}`
      };
    }
  } catch (textError) {
    // Failed to read response body
    return {
      ok: false,
      status,
      raw: '',
      errorMessage: `Failed to read response body: ${textError instanceof Error ? textError.message : 'Unknown error'}`
    };
  }
}

/**
 * Log failed response for debugging
 */
export function logResponseFailure(
  endpoint: string,
  result: SafeJsonResult,
  context?: Record<string, any>
) {
  console.error('[API Error]', {
    endpoint,
    status: result.status,
    traceId: result.traceId,
    errorMessage: result.errorMessage,
    rawPreview: result.raw.substring(0, 300),
    context
  });
}
