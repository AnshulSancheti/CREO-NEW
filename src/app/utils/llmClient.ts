import { safeJsonParse } from '@/app/utils/jsonHelpers';

export type LLMProvider = 'gemini' | 'openai' | 'claude';

export interface LLMRequest {
    provider?: LLMProvider;
    model?: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    topP?: number;
    topK?: number;
}

export interface LLMResponse {
    text: string;
    provider: LLMProvider;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface LLMRetryOptions {
    apiKey: string;
    provider?: LLMProvider;
    model: string;
    body: unknown;
    maxRetries?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    headers?: Record<string, string>;
}

export interface LLMRetryResult {
    response: Response | null;
    status?: number;
    errorMessage?: string;
    attempts: number;
    wasRateLimited: boolean;
    provider?: LLMProvider;
    model?: string;
}

const RATE_LIMIT_STATUS = new Set([429, 503]);
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_INITIAL_DELAY_MS = 500;
const DEFAULT_BACKOFF_MULTIPLIER = 2;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitWithJitter = async (ms: number) => {
    const jitter = Math.floor(Math.random() * 250);
    await wait(ms + jitter);
};

const parseRetryAfterHeader = (headers: Headers): number | null => {
    const retryAfter = headers.get('retry-after');
    if (!retryAfter) return null;

    const numericValue = Number(retryAfter);
    if (!Number.isNaN(numericValue)) {
        return Math.max(numericValue * 1000, 0);
    }

    const retryDate = Date.parse(retryAfter);
    if (!Number.isNaN(retryDate)) {
        return Math.max(retryDate - Date.now(), 0);
    }

    return null;
};

const buildErrorMessage = (raw: string, status?: number, provider?: string): string => {
    const parsed = safeJsonParse(raw);
    if (parsed.success) {
        return (
            parsed.data?.error?.message ||
            parsed.data?.message ||
            parsed.data?.error ||
            raw ||
            `${provider || 'LLM'} API Error${status ? ` ${status}` : ''}`
        );
    }
    return raw || `${provider || 'LLM'} API Error${status ? ` ${status}` : ''}`;
};

/**
 * Call Gemini API with retry logic
 */
async function callGeminiAPI(
    apiKey: string,
    model: string,
    body: unknown,
    headers: Record<string, string> = {}
): Promise<Response> {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: payload
        }
    );
}

/**
 * Call OpenAI API (via Emergent proxy or direct)
 */
async function callOpenAIAPI(
    apiKey: string,
    model: string,
    body: unknown,
    headers: Record<string, string> = {}
): Promise<Response> {
    const isEmergentKey = apiKey.startsWith('sk-emergent-');
    const endpoint = isEmergentKey
        ? 'https://api.emergent.ai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    // Convert body to OpenAI format
    const requestBody = typeof body === 'object' && body !== null
        ? convertToOpenAIFormat(body as any, model)
        : body;

    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...headers
        },
        body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
    });
}

/**
 * Call Claude API (via Emergent proxy or direct)
 */
async function callClaudeAPI(
    apiKey: string,
    model: string,
    body: unknown,
    headers: Record<string, string> = {}
): Promise<Response> {
    const isEmergentKey = apiKey.startsWith('sk-emergent-');
    const endpoint = isEmergentKey
        ? 'https://api.emergent.ai/v1/messages'
        : 'https://api.anthropic.com/v1/messages';

    // Convert body to Claude format
    const requestBody = typeof body === 'object' && body !== null
        ? convertToClaudeFormat(body as any, model)
        : body;

    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            ...headers
        },
        body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
    });
}

/**
 * Convert Gemini-style request to OpenAI format
 */
function convertToOpenAIFormat(geminiBody: any, model: string): any {
    const messages: any[] = [];

    if (geminiBody.contents && Array.isArray(geminiBody.contents)) {
        for (const content of geminiBody.contents) {
            if (content.parts && Array.isArray(content.parts)) {
                const text = content.parts.map((p: any) => p.text || '').join('\n');
                messages.push({
                    role: content.role || 'user',
                    content: text
                });
            }
        }
    }

    return {
        model: model,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: '' }],
        temperature: geminiBody.generationConfig?.temperature ?? 0.7,
        max_tokens: geminiBody.generationConfig?.maxOutputTokens ?? 2048,
        top_p: geminiBody.generationConfig?.topP ?? 0.95
    };
}

/**
 * Convert Gemini-style request to Claude format
 */
function convertToClaudeFormat(geminiBody: any, model: string): any {
    const messages: any[] = [];

    if (geminiBody.contents && Array.isArray(geminiBody.contents)) {
        for (const content of geminiBody.contents) {
            if (content.parts && Array.isArray(content.parts)) {
                const text = content.parts.map((p: any) => p.text || '').join('\n');
                messages.push({
                    role: content.role === 'model' ? 'assistant' : 'user',
                    content: text
                });
            }
        }
    }

    return {
        model: model,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: '' }],
        max_tokens: geminiBody.generationConfig?.maxOutputTokens ?? 2048,
        temperature: geminiBody.generationConfig?.temperature ?? 0.7
    };
}

/**
 * Normalize response from different providers to common format
 */
async function normalizeResponse(response: Response, provider: LLMProvider): Promise<any> {
    const data = await response.json();

    switch (provider) {
        case 'gemini':
            return data; // Already in Gemini format

        case 'openai':
            // Convert OpenAI format to Gemini-like format
            if (data.choices && data.choices[0]) {
                return {
                    candidates: [{
                        content: {
                            parts: [{ text: data.choices[0].message?.content || '' }]
                        },
                        finishReason: data.choices[0].finish_reason
                    }],
                    model: data.model,
                    usage: data.usage
                };
            }
            return data;

        case 'claude':
            // Convert Claude format to Gemini-like format
            if (data.content && Array.isArray(data.content)) {
                const text = data.content.filter((c: any) => c.type === 'text')
                    .map((c: any) => c.text)
                    .join('\n');
                return {
                    candidates: [{
                        content: {
                            parts: [{ text }]
                        },
                        finishReason: data.stop_reason
                    }],
                    model: data.model,
                    usage: data.usage
                };
            }
            return data;

        default:
            return data;
    }
}

/**
 * Detect provider from model name
 */
function detectProvider(model: string): LLMProvider {
    if (model.startsWith('gpt-') || model.includes('openai')) return 'openai';
    if (model.startsWith('claude-') || model.includes('anthropic')) return 'claude';
    return 'gemini';
}

/**
 * Call LLM with automatic provider detection and retry logic
 */
export async function callLLMWithRetry(
    options: LLMRetryOptions
): Promise<LLMRetryResult> {
    const {
        apiKey,
        model,
        body,
        headers = {},
        maxRetries = DEFAULT_MAX_RETRIES,
        initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
        backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER
    } = options;

    const provider = options.provider || detectProvider(model);
    const totalAttempts = Math.max(1, maxRetries + 1);
    let attempt = 0;
    let lastStatus: number | undefined;
    let lastErrorMessage = '';
    let wasRateLimited = false;

    while (attempt < totalAttempts) {
        try {
            let response: Response;

            // Call appropriate API based on provider
            switch (provider) {
                case 'openai':
                    response = await callOpenAIAPI(apiKey, model, body, headers);
                    break;
                case 'claude':
                    response = await callClaudeAPI(apiKey, model, body, headers);
                    break;
                case 'gemini':
                default:
                    response = await callGeminiAPI(apiKey, model, body, headers);
                    break;
            }

            if (response.ok) {
                // Normalize response to consistent format
                const normalizedData = await normalizeResponse(response.clone(), provider);

                // Create new Response with normalized data
                const normalizedResponse = new Response(JSON.stringify(normalizedData), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });

                return {
                    response: normalizedResponse,
                    attempts: attempt + 1,
                    wasRateLimited,
                    provider,
                    model
                };
            }

            lastStatus = response.status;
            const errorText = await response.text();
            lastErrorMessage = buildErrorMessage(errorText, lastStatus, provider);

            if (RATE_LIMIT_STATUS.has(response.status) && attempt < totalAttempts - 1) {
                wasRateLimited = true;
                const retryDelay =
                    parseRetryAfterHeader(response.headers) ??
                    Math.round(initialDelayMs * Math.pow(backoffMultiplier, attempt));

                console.warn(
                    `${provider} rate limit hit for model ${model} (status ${response.status}). Retrying in ${retryDelay}ms...`
                );
                await waitWithJitter(retryDelay);
                attempt += 1;
                continue;
            }

            return {
                response: null,
                status: response.status,
                errorMessage: lastErrorMessage,
                attempts: attempt + 1,
                wasRateLimited,
                provider,
                model
            };
        } catch (error) {
            lastStatus = 0;
            lastErrorMessage = error instanceof Error ? error.message : String(error);

            if (attempt < totalAttempts - 1) {
                const retryDelay = Math.round(initialDelayMs * Math.pow(backoffMultiplier, attempt));
                console.warn(
                    `${provider} request error for model ${model}. Retrying in ${retryDelay}ms...`,
                    error
                );
                await waitWithJitter(retryDelay);
                attempt += 1;
                continue;
            }

            return {
                response: null,
                status: lastStatus,
                errorMessage: lastErrorMessage,
                attempts: attempt + 1,
                wasRateLimited,
                provider,
                model
            };
        }
    }

    return {
        response: null,
        status: lastStatus,
        errorMessage: lastErrorMessage || `${provider} request failed`,
        attempts: totalAttempts,
        wasRateLimited,
        provider,
        model
    };
}

/**
 * @deprecated Use callLLMWithRetry instead for multi-provider support
 */
export async function callGeminiWithRetry(options: LLMRetryOptions): Promise<LLMRetryResult> {
    return callLLMWithRetry({ ...options, provider: 'gemini' });
}
