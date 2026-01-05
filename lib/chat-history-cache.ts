import { Chat } from "./db/schema";

/**
 * Global singleton to consolidate concurrent chat history requests.
 * Prevents multiple components from triggering the same 'history' network call.
 */
class ChatHistoryCache {
    private cache: Map<string, any> = new Map();
    private pendingFetches: Map<string, Promise<any>> = new Map();
    private lastFetchTime: Map<string, number> = new Map();
    private readonly TTL = 10000; // 10 seconds freshness

    async getHistory<T>(userId: string, limit: number, fetcher: () => Promise<T>): Promise<T> {
        const cacheKey = `${userId}-${limit}`;
        const now = Date.now();
        
        // 1. Return cached data if fresh
        const cached = this.cache.get(cacheKey);
        const lastTime = this.lastFetchTime.get(cacheKey) || 0;
        if (cached && (now - lastTime < this.TTL)) {
            return cached as T;
        }

        // 2. Return existing pending promise to consolidate concurrent requests
        const existingPending = this.pendingFetches.get(cacheKey);
        if (existingPending) {
            return existingPending as Promise<T>;
        }

        // 3. Create a new fetch promise with a "lock"
        let resolveRef: (val: T) => void = () => {};
        const newPromise = new Promise<T>((resolve) => {
            resolveRef = resolve;
        });
        
        this.pendingFetches.set(cacheKey, newPromise);

        try {
            const data = await fetcher();
            this.cache.set(cacheKey, data);
            this.lastFetchTime.set(cacheKey, now);
            resolveRef(data);
            return data;
        } catch (error) {
            this.pendingFetches.delete(cacheKey);
            throw error;
        } finally {
            this.pendingFetches.delete(cacheKey);
        }
    }

    clear() {
        this.cache.clear();
        this.pendingFetches.clear();
        this.lastFetchTime.clear();
    }
}

export const chatHistoryCache = new ChatHistoryCache();
