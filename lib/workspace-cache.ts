// Global workspace data cache for instant loading
// This persists across component re-renders

import { Edge, Node } from 'reactflow';

export interface WorkspaceData {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
  timestamp?: number; // When this data was cached
}

class WorkspaceCacheService {
  private cache: Map<string, WorkspaceData> = new Map();
  private pendingFetches: Map<string, Promise<WorkspaceData | null>> = new Map();

  // Get cached workspace data
  get(workspaceId: string): WorkspaceData | undefined {
    const data = this.cache.get(workspaceId);
    if (data) {
      console.log(`[WorkspaceCache] Hit for ${workspaceId}: ${data.nodes.length} nodes`);
    } else {
      console.log(`[WorkspaceCache] Miss for ${workspaceId}`);
    }
    return data;
  }

  // Set workspace data in cache
  set(workspaceId: string, data: WorkspaceData): void {
    console.log(`[WorkspaceCache] Setting ${workspaceId}: ${data.nodes.length} nodes`);
    this.cache.set(workspaceId, { ...data, timestamp: Date.now() });
  }

  // Check if workspace is cached
  has(workspaceId: string): boolean {
    return this.cache.has(workspaceId);
  }

  // Prefetch workspace data (deduped)
  async prefetch(
    workspaceId: string, 
    fetcher: (id: string) => Promise<WorkspaceData | null>
  ): Promise<void> {
    // Already cached
    if (this.cache.has(workspaceId)) {
      console.log(`[WorkspaceCache] Prefetch skip (cached): ${workspaceId}`);
      return;
    }
    
    // Already fetching
    if (this.pendingFetches.has(workspaceId)) {
      console.log(`[WorkspaceCache] Prefetch skip (pending): ${workspaceId}`);
      return;
    }

    console.log(`[WorkspaceCache] Prefetching ${workspaceId}...`);
    const fetchPromise = fetcher(workspaceId)
      .then((data) => {
        if (data) {
          console.log(`[WorkspaceCache] Prefetch success for ${workspaceId}: ${data.nodes.length} nodes`);
          this.cache.set(workspaceId, data);
        }
        return data;
      })
      .finally(() => {
        this.pendingFetches.delete(workspaceId);
      });

    this.pendingFetches.set(workspaceId, fetchPromise);
  }

  // Clear a specific workspace from cache
  clear(workspaceId: string): void {
    this.cache.delete(workspaceId);
  }

  // Clear entire cache
  clearAll(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const workspaceCache = new WorkspaceCacheService();
