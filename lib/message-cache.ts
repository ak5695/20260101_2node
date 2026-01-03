// Global message cache for instant chat loading
// This persists across component re-renders

import { ChatMessage } from '@/lib/types';

class MessageCacheService {
  private cache: Map<string, ChatMessage[]> = new Map();
  private pendingFetches: Map<string, Promise<ChatMessage[]>> = new Map();

  // Get cached messages
  get(chatId: string): ChatMessage[] | undefined {
    return this.cache.get(chatId);
  }

  // Set messages in cache
  set(chatId: string, messages: ChatMessage[]): void {
    this.cache.set(chatId, messages);
  }

  // Check if chat is cached
  has(chatId: string): boolean {
    return this.cache.has(chatId);
  }

  // Prefetch messages for a chat (deduped)
  async prefetch(chatId: string, fetcher: (id: string) => Promise<ChatMessage[]>): Promise<void> {
    // Already cached
    if (this.cache.has(chatId)) return;
    
    // Already fetching
    if (this.pendingFetches.has(chatId)) return;

    const fetchPromise = fetcher(chatId)
      .then((messages) => {
        this.cache.set(chatId, messages);
        return messages;
      })
      .finally(() => {
        this.pendingFetches.delete(chatId);
      });

    this.pendingFetches.set(chatId, fetchPromise);
  }

  // Clear a specific chat from cache
  clear(chatId: string): void {
    this.cache.delete(chatId);
  }

  // Clear entire cache
  clearAll(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const messageCache = new MessageCacheService();
