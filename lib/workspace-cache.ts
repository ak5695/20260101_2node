// Global workspace data cache for instant loading
// This persists across component re-renders

import { Edge, Node } from 'reactflow';

export interface WorkspaceData {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
  timestamp?: number; 
}

// 采用更严格的全局单例模式，防止 HMR 导致多实例
const GLOBAL_CACHE_KEY = '__2NODE_WORKSPACE_CACHE__';
const GLOBAL_PENDING_KEY = '__2NODE_PENDING_FETCHES__';

if (!(global as any)[GLOBAL_CACHE_KEY]) {
    (global as any)[GLOBAL_CACHE_KEY] = new Map<string, WorkspaceData>();
}
if (!(global as any)[GLOBAL_PENDING_KEY]) {
    (global as any)[GLOBAL_PENDING_KEY] = new Map<string, Promise<WorkspaceData | null>>();
}

const cacheMap: Map<string, WorkspaceData> = (global as any)[GLOBAL_CACHE_KEY];
const pendingFetches: Map<string, Promise<WorkspaceData | null>> = (global as any)[GLOBAL_PENDING_KEY];

const isBrowser = typeof window !== 'undefined';

class WorkspaceCacheService {
  constructor() {
    // Hydrate from localStorage on initialization (browser only)
    if (isBrowser) {
      try {
        const saved = localStorage.getItem(GLOBAL_CACHE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([id, data]: [string, any]) => {
            cacheMap.set(id, data);
          });
          console.log(`[Cache] Restored ${cacheMap.size} workspaces from local storage`);
        }
      } catch (e) {
        console.error("[Cache] Failed to hydrate workspace cache", e);
      }
    }
  }

  private persist() {
    if (isBrowser) {
      try {
        const data = Object.fromEntries(cacheMap.entries());
        // Only keep the most recent entries if cache gets too large (> 4MB)
        localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("[Cache] Storage limit reached, clearing old entries...");
        // Fast cleanup: just keeping the mapping for now
        this.clearAll();
      }
    }
  }

  get(workspaceId: string): WorkspaceData | undefined {
    return cacheMap.get(workspaceId);
  }

  set(workspaceId: string, data: WorkspaceData): void {
    cacheMap.set(workspaceId, { ...data, timestamp: Date.now() });
    this.persist();
  }

  has(workspaceId: string): boolean {
    return cacheMap.has(workspaceId);
  }

  // 核心去重抓取逻辑：确保绝对原子性，防止微秒级竞争
  async prefetch(
    workspaceId: string, 
    fetcher: (id: string) => Promise<WorkspaceData | null>
  ): Promise<WorkspaceData | null> {
    const now = Date.now();
    
    // 1. 如果已有新鲜缓存（15秒内），直接返回
    const existing = cacheMap.get(workspaceId);
    if (existing && existing.timestamp && (now - existing.timestamp < 15000)) {
      return existing;
    }
    
    // 2. 检查排队锁（Pending Promise）
    const inProgress = pendingFetches.get(workspaceId);
    if (inProgress) {
      return inProgress;
    }

    // 3. 核心改进：同步创建一个 Promise 占位符并立即存入 Map
    let resolveRef: (val: WorkspaceData | null) => void = () => {};
    const fetchPromise = new Promise<WorkspaceData | null>((resolve) => {
      resolveRef = resolve;
    });
    
    pendingFetches.set(workspaceId, fetchPromise);

    // 4. 在后台发起真正的网络获取
    (async () => {
      try {
        const data = await fetcher(workspaceId);
        if (data) {
          const dataWithTime = { ...data, timestamp: now };
          cacheMap.set(workspaceId, dataWithTime);
          this.persist(); // 持久化到本地
          resolveRef(dataWithTime);
        } else {
          resolveRef(null);
        }
      } catch (err) {
        console.error(`[CacheLock] Fetch failed for ${workspaceId}:`, err);
        resolveRef(null);
      } finally {
        pendingFetches.delete(workspaceId);
      }
    })();

    return fetchPromise;
  }

  clear(workspaceId: string): void {
    cacheMap.delete(workspaceId);
    this.persist();
  }

  clearAll(): void {
    cacheMap.clear();
    if (isBrowser) localStorage.removeItem(GLOBAL_CACHE_KEY);
  }
}

export const workspaceCache = new WorkspaceCacheService();
