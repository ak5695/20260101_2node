"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "./ui/sidebar";
import { Trash, MoreHorizontal, Layout, ChevronLeft, MessageSquare, ChevronRight, Maximize2, Search, X, MessageSquarePlus, Edit2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { workspaceCache, WorkspaceData } from "@/lib/workspace-cache";
import { getWorkspaceDataAction, deleteNodeAction, updateWorkspaceNameAction } from "@/lib/actions/canvas";
import { MarkerType, Node } from "reactflow";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WorkspaceNode {
  id: string;
  type: string;
  summaryQuestion: string;
  summaryAnswer: string;
  fullQuestion: string;
  fullAnswer: string;
  chatId?: string; // Link to the chat conversation
}

type ViewMode = 'workspaces' | 'nodes' | 'detail';

export function SidebarWorkspaceHistory() {
  const { data, mutate, isLoading } = useSWR("/api/workspaces", fetcher);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingNode, setIsDeletingNode] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");
  const router = useRouter();
  const params = useParams();
  const currentWorkspaceId = params.workspaceId as string | undefined;
  
  // Hierarchical navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('workspaces');
  const [selectedWorkspace, setSelectedWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [nodes, setNodes] = useState<WorkspaceNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkspaceNode | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Race condition tracker
  const lastRequestedWorkspaceId = useRef<string | null>(null);
  const manuallyBackingOutFrom = useRef<string | null>(null);

  // Selection state for detail view
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const detailContainerRef = useRef<HTMLDivElement>(null);


  // Handle request-node-detail from canvas
  useEffect(() => {
    const handleRequest = async (event: any) => {
      const { nodeId, workspaceId } = event.detail;
      
      if (workspaceId && workspaceId !== currentWorkspaceId) {
        router.push(`/canvas/${workspaceId}`);
        return;
      }

      let node = nodes.find(n => n.id === nodeId);
      
      if (!node && currentWorkspaceId) {
        // Check cache first
        const cached = workspaceCache.get(currentWorkspaceId);
        if (cached) {
            const cachedNode = cached.nodes.find(n => n.id === nodeId);
            if (cachedNode) {
                node = {
                    id: cachedNode.id,
                    type: cachedNode.type || 'chatNode',
                    summaryQuestion: cachedNode.type === 'textNode' ? (cachedNode.data.text || '') : (cachedNode.data.summaryQuestion || ''),
                    summaryAnswer: cachedNode.type === 'textNode' ? '' : (cachedNode.data.summaryAnswer || ''),
                    fullQuestion: cachedNode.type === 'textNode' ? (cachedNode.data.text || '') : (cachedNode.data.fullQuestion || ''),
                    fullAnswer: cachedNode.type === 'textNode' ? '' : (cachedNode.data.fullAnswer || ''),
                    chatId: (cachedNode.data as any).chatId,
                };
            }
        }

        if (!node) {
            setLoadingNodes(true);
            const wsData = await getWorkspaceDataAction(currentWorkspaceId);
            if (wsData) {
              const freshNodes = wsData.nodes.map((n: any) => ({
                id: n.id,
                type: n.type,
                summaryQuestion: n.summaryQuestion || '',
                summaryAnswer: n.summaryAnswer || '',
                fullQuestion: n.fullQuestion || '',
                fullAnswer: n.fullAnswer || '',
                chatId: (n as any).chatId || (n.data as any).chatId,
              }));
              setNodes(freshNodes);
              node = freshNodes.find((n: any) => n.id === nodeId);
            }
            setLoadingNodes(false);
        }
      }

      if (node) {
        setSelectedNode(node);
        setViewMode('detail');
      }
    };

    window.addEventListener('request-node-detail', handleRequest);
    return () => window.removeEventListener('request-node-detail', handleRequest);
  }, [currentWorkspaceId, nodes, router]);

  const handleDeleteWorkspace = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    if (!window.confirm("确定要删除这个工作空间吗？所有节点和连接都将被删除。")) return;

    // Optimistic update - remove immediately from UI
    const previousData = data;
    mutate({
      ...data,
      workspaces: data.workspaces.filter((w: any) => w.id !== workspaceId)
    }, false);
    
    // If we're viewing this workspace, navigate away immediately
    if (currentWorkspaceId === workspaceId) {
      router.push('/canvas');
    }
    
    toast.success("工作空间已删除");

    try {
      // Delete in background
      await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' });
      // Revalidate to ensure consistency
      mutate();
    } catch (error) {
      // Revert on error
      toast.error("删除失败");
      mutate(previousData, false);
    }
  };

  const handleStartRename = (ws: { id: string, name: string }) => {
    setRenamingId(ws.id);
    setRenamingName(ws.name || "");
  };

  const handleRenameWorkspace = async () => {
    if (!renamingId || !renamingName.trim()) {
      setRenamingId(null);
      return;
    }

    const originalWorkspace = data.workspaces.find((w: any) => w.id === renamingId);
    if (renamingName === originalWorkspace?.name) {
      setRenamingId(null);
      return;
    }

    // Optimistic update - rename immediately in UI
    const previousData = data;
    mutate({
      ...data,
      workspaces: data.workspaces.map((w: any) => 
        w.id === renamingId ? { ...w, name: renamingName } : w
      )
    }, false);
    
    // Update selected workspace name if it's the current one
    if (selectedWorkspace?.id === renamingId) {
      setSelectedWorkspace({ id: renamingId, name: renamingName });
    }
    
    toast.success("重命名成功");
    setRenamingId(null);

    try {
      // Update in background
      await updateWorkspaceNameAction(renamingId, renamingName);
      mutate();
    } catch (error) {
      // Revert on error
      toast.error("重命名失败");
      setRenamingId(null);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!window.confirm("确定要从画布中删除这个节点吗？")) return;

    setIsDeletingNode(nodeId);
    try {
      await deleteNodeAction(nodeId);
      
      // Update local state
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      
      // If we are currently viewing this node, go back
      if (selectedNode?.id === nodeId) {
        setViewMode('nodes');
        setSelectedNode(null);
      }

      // Sync with canvas
      window.dispatchEvent(new CustomEvent('node-deleted-from-sidebar', { detail: { nodeId } }));
      
      toast.success("节点已删除");
    } catch (error) {
      toast.error("删除节点失败");
    } finally {
      setIsDeletingNode(null);
    }
  };

  // Select workspace and load its nodes
  const handleSelectWorkspace = useCallback(async (ws: { id: string; name: string }) => {
    // If clicking the current workspace while already in nodes view, just ensure the view mode is correct
    if (selectedWorkspace?.id === ws.id && viewMode === 'nodes') {
      return;
    }

    // Immediate UI update
    setSelectedWorkspace(ws);
    setViewMode('nodes');
    setSearchQuery('');
    lastRequestedWorkspaceId.current = ws.id;
    manuallyBackingOutFrom.current = null;
    
    // Navigate immediately for instant feedback
    if (currentWorkspaceId !== ws.id) {
      router.push(`/canvas/${ws.id}`);
    }
    
    const formatFromReactFlow = (n: any) => ({
      id: n.id,
      type: n.type || 'chatNode',
      summaryQuestion: n.type === 'textNode' ? (n.data.text || '') : (n.data.summaryQuestion || ''),
      summaryAnswer: n.type === 'textNode' ? '' : (n.data.summaryAnswer || ''),
      fullQuestion: n.type === 'textNode' ? (n.data.text || '') : (n.data.fullQuestion || ''),
      fullAnswer: n.type === 'textNode' ? '' : (n.data.fullAnswer || ''),
      chatId: (n.data as any).chatId,
    });

    const formatFromDB = (n: any) => ({
      id: n.id,
      type: n.type || 'chatNode',
      summaryQuestion: n.summaryQuestion || '',
      summaryAnswer: n.summaryAnswer || '',
      fullQuestion: n.fullQuestion || '',
      fullAnswer: n.fullAnswer || '',
      chatId: (n as any).chatId || (n.data as any)?.chatId,
    });

    // Check cache first for instant display
    const cached = workspaceCache.get(ws.id);
    if (cached && cached.nodes.length > 0) {
      const cachedNodes: WorkspaceNode[] = cached.nodes.map(formatFromReactFlow);
      setNodes(cachedNodes);
      setLoadingNodes(false);
      
      // Background refresh if data is stale (>30s)
      const cacheAge = Date.now() - (cached.timestamp || 0);
      if (cacheAge > 30000) {
        getWorkspaceDataAction(ws.id).then(wsData => {
          if (lastRequestedWorkspaceId.current !== ws.id) return;
          if (wsData) {
            const freshNodes: WorkspaceNode[] = wsData.nodes.map(formatFromDB);
            setNodes(freshNodes);
            
            // Update cache
            const freshReactFlowNodes = wsData.nodes.map(n => ({
              id: n.id,
              type: n.type || 'chatNode',
              position: { x: n.positionX, y: n.positionY },
              data: n.type === 'textNode' 
                ? { text: n.summaryQuestion || '', fontSize: 'md' }
                : {
                    summaryQuestion: n.summaryQuestion,
                    summaryAnswer: n.summaryAnswer,
                    fullQuestion: n.fullQuestion,
                    fullAnswer: n.fullAnswer,
                    highlights: n.highlights || [],
                    chatId: (n as any).chatId,
                  },
            }));
            const freshEdges = wsData.edges.map(e => ({
              id: e.id,
              source: e.sourceNodeId,
              target: e.targetNodeId,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              type: 'custom',
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
            }));
            
            workspaceCache.set(ws.id, {
              nodes: freshReactFlowNodes,
              edges: freshEdges,
              viewport: (wsData.workspace.settings as any)?.viewport,
            });
          }
        }).catch(() => {});
      }
      return;
    }

    // No cache - show empty state immediately, load in background
    setNodes([]);
    setLoadingNodes(true);
    
    getWorkspaceDataAction(ws.id).then(wsData => {
      if (lastRequestedWorkspaceId.current !== ws.id) return;
      if (wsData) {
        if (wsData.workspace?.name && selectedWorkspace?.id === ws.id && selectedWorkspace?.name !== wsData.workspace.name) {
          setSelectedWorkspace({ id: ws.id, name: wsData.workspace.name });
        }
        const nodesList: WorkspaceNode[] = wsData.nodes.map(formatFromDB);
        setNodes(nodesList);
      } else {
        setNodes([]);
      }
      setLoadingNodes(false);
    }).catch(error => {
      console.error('Failed to load nodes:', error);
      setNodes([]);
      setLoadingNodes(false);
    });
  }, [router, selectedWorkspace, viewMode, currentWorkspaceId]);
 
   // Auto-select current workspace from URL
   useEffect(() => {
     if (currentWorkspaceId && data?.workspaces) {
       // If the user manually clicked back from this workspace, don't auto-pull them back in
       // UNLESS it's the very first load (selectedWorkspace is null)
       if (currentWorkspaceId === manuallyBackingOutFrom.current && viewMode === 'workspaces' && selectedWorkspace) {
         return;
       }

       const ws = data.workspaces.find((w: any) => w.id === currentWorkspaceId);
       if (ws) {
         // Only switch to nodes view if we aren't already there or in detail view
         if (viewMode === 'workspaces') {
           handleSelectWorkspace(ws);
         } else if (selectedWorkspace?.id !== ws.id) {
           // If ID changed externally (e.g. browser back/forward), update data
           handleSelectWorkspace(ws);
         }
       }
     } else if (!currentWorkspaceId && viewMode !== 'workspaces') {
        manuallyBackingOutFrom.current = null;
        setViewMode('workspaces');
        setSelectedWorkspace(null);
     }
   }, [currentWorkspaceId, data?.workspaces, viewMode, handleSelectWorkspace]);

  // Listen for node updates from canvas
  useEffect(() => {
    const handleNodesUpdated = (event: any) => {
      const { nodes: updatedNodes, workspaceId: eventWorkspaceId } = event.detail;
      
      // Safety check: only update if the event is for the CURRENTLY selected workspace
      if (eventWorkspaceId && selectedWorkspace && eventWorkspaceId !== selectedWorkspace.id) {
        return;
      }

      // If we get an empty list, it means switching or clearing
      if (updatedNodes.length === 0 && viewMode === 'nodes') {
        // setNodes([]); // Optional: clear UI immediately
        return;
      }
      
      if (viewMode === 'nodes' && selectedWorkspace) {
        const nodesList: WorkspaceNode[] = updatedNodes.map((n: any) => ({
          id: n.id,
          type: n.type || 'chatNode',
          summaryQuestion: n.type === 'textNode' ? (n.data?.text || '') : (n.data?.summaryQuestion || ''),
          summaryAnswer: n.type === 'textNode' ? '' : (n.data?.summaryAnswer || ''),
          fullQuestion: n.type === 'textNode' ? (n.data?.text || '') : (n.data?.fullQuestion || ''),
          fullAnswer: n.type === 'textNode' ? '' : (n.data?.fullAnswer || ''),
          chatId: n.data?.chatId,
        }));
        setNodes(nodesList);
      }
    };

    window.addEventListener('nodes-updated', handleNodesUpdated);
    return () => window.removeEventListener('nodes-updated', handleNodesUpdated);
  }, [viewMode, selectedWorkspace]);

  // Filtered nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.summaryQuestion.toLowerCase().includes(query) || 
      n.fullQuestion.toLowerCase().includes(query) ||
      n.summaryAnswer.toLowerCase().includes(query) ||
      n.fullAnswer.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  // Fast workspace switch (for prev/next navigation)
  const handleFastSwitchWorkspace = useCallback((ws: { id: string; name: string }) => {
    // Immediate UI update
    setSelectedWorkspace(ws);
    lastRequestedWorkspaceId.current = ws.id;
    
    // Navigate immediately
    router.push(`/canvas/${ws.id}`);
    
    // Load data in background using existing logic
    handleSelectWorkspace(ws);
  }, [router, handleSelectWorkspace]);

  // View node detail
  const handleSelectNode = useCallback((node: WorkspaceNode) => {
    setSelectedNode(node);
    setViewMode('detail');
    setSelection(null);
    window.dispatchEvent(new CustomEvent('focus-node', { detail: { nodeId: node.id } }));
  }, []);

  // Text selection handler
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim() && detailContainerRef.current) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Only show if selection is within the container
      if (detailContainerRef.current.contains(range.startContainer)) {
        setSelection({
          text: sel.toString().trim(),
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    } else {
      setSelection(null);
    }
  };

  const handleAskAI = () => {
    if (!selection) return;
    
    // Switch to Chat tab
    window.dispatchEvent(new CustomEvent('request-chat-query', { 
      detail: { 
        query: selection.text,
        chatId: selectedNode?.chatId 
      } 
    }));
    
    setSelection(null);
  };

  // Go back
  const handleBack = useCallback(() => {
    if (viewMode === 'detail') {
      setViewMode('nodes');
      setSelectedNode(null);
      setSelection(null);
    } else if (viewMode === 'nodes') {
      manuallyBackingOutFrom.current = currentWorkspaceId || null;
      setViewMode('workspaces');
      // We DON'T push '/canvas' here to keep the current canvas visible
    }
  }, [viewMode, router, currentWorkspaceId]);

  // Prefetch workspace data on hover
  const handlePrefetch = useCallback((workspaceId: string) => {
    workspaceCache.prefetch(workspaceId, async (id) => {
      const data = await getWorkspaceDataAction(id);
      if (!data) return null;
      
      const nodes = data.nodes.map((n: any) => ({
        id: n.id,
        type: n.type || 'chatNode',
        position: { x: n.positionX, y: n.positionY },
        data: n.type === 'textNode' 
          ? { text: n.summaryQuestion || '', fontSize: 'md' }
          : {
              summaryQuestion: n.summaryQuestion,
              summaryAnswer: n.summaryAnswer,
              fullQuestion: n.fullQuestion,
              fullAnswer: n.fullAnswer,
              highlights: n.highlights || [],
              chatId: (n as any).chatId,
            },
      }));
      
      const edges = data.edges.map((e: any) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: 'custom',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
      }));
      
      const settings = data.workspace.settings as any;
      
      return {
        nodes,
        edges,
        viewport: settings?.viewport,
      };
    });
  }, []);

  // Listen for workspace creation events
  useEffect(() => {
    const handleWorkspaceCreated = (event: any) => {
      const { workspace } = event.detail;
      if (workspace && data) {
        // Optimistically add to list
        mutate({
          ...data,
          workspaces: [workspace, ...(data.workspaces || [])],
        }, false);
        
        // Revalidate in background
        setTimeout(() => mutate(), 100);
      }
    };

    window.addEventListener('workspace-created', handleWorkspaceCreated);
    return () => window.removeEventListener('workspace-created', handleWorkspaceCreated);
  }, [data, mutate]);

  // Workspace list view
  if (viewMode === 'workspaces') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-xs text-zinc-500 animate-pulse">加载中...</div>
        ) : !data?.workspaces?.length ? (
          <div className="p-4 text-xs text-zinc-500 text-center">暂无工作空间</div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <SidebarMenu className="px-2 py-2">
              {data.workspaces.map((ws: any) => (
                <SidebarMenuItem 
                  key={ws.id}
                  onMouseEnter={() => handlePrefetch(ws.id)}
                >
                  <SidebarMenuButton 
                    isActive={currentWorkspaceId === ws.id}
                    onClick={() => renamingId !== ws.id && handleSelectWorkspace(ws)}
                    onDoubleClick={() => handleStartRename(ws)}
                    className="group"
                  >
                    <Layout size={16} className="shrink-0" />
                    {renamingId === ws.id ? (
                      <input
                        autoFocus
                        className="bg-zinc-800 text-white text-xs px-1 py-0.5 rounded border border-white/20 outline-none w-full"
                        value={renamingName}
                        onChange={(e) => setRenamingName(e.target.value)}
                        onBlur={handleRenameWorkspace}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameWorkspace();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="truncate flex-1">{ws.name || "未命名空间"}</span>
                        <ChevronRight size={14} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    )}
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal size={14} />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleStartRename(ws)}
                      >
                        <Edit2 size={14} className="mr-2" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10"
                        onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                      >
                        <Trash size={14} className="mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        )}
      </div>
    );
  }

  // Nodes list view
  if (viewMode === 'nodes') {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header with back button and workspace navigation */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 bg-[#1a1a1a]">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-sm"
          >
            <ChevronLeft size={18} />
            <span>返回列表</span>
          </button>
          
          <span className="text-sm font-bold text-white flex-1 text-center">{selectedWorkspace?.name || '节点列表'}</span>
          
          <div className="flex items-center gap-2">
            {/* Previous/Next Workspace Navigation */}
            <button
              onClick={() => {
                if (!data?.workspaces) return;
                const currentIndex = data.workspaces.findIndex((w: any) => w.id === selectedWorkspace?.id);
                if (currentIndex > 0) {
                  handleFastSwitchWorkspace(data.workspaces[currentIndex - 1]);
                }
              }}
              disabled={!data?.workspaces || data.workspaces.findIndex((w: any) => w.id === selectedWorkspace?.id) === 0}
              className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="上一个画布"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                if (!data?.workspaces) return;
                const currentIndex = data.workspaces.findIndex((w: any) => w.id === selectedWorkspace?.id);
                if (currentIndex < data.workspaces.length - 1) {
                  handleFastSwitchWorkspace(data.workspaces[currentIndex + 1]);
                }
              }}
              disabled={!data?.workspaces || data.workspaces.findIndex((w: any) => w.id === selectedWorkspace?.id) === data.workspaces.length - 1}
              className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="下一个画布"
            >
              <ChevronRight size={20} />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-white/10 transition-colors text-zinc-500">
                  <MoreHorizontal size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => {
                    if (selectedWorkspace) {
                      handleStartRename(selectedWorkspace);
                    }
                  }}
                >
                  <Edit2 size={14} className="mr-2" />
                  重命名画布
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:bg-destructive/10"
                  onClick={(e) => {
                    if (selectedWorkspace) {
                      handleDeleteWorkspace(e, selectedWorkspace.id);
                    }
                  }}
                >
                  <Trash size={14} className="mr-2" />
                  删除画布
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 border-b border-white/5 bg-[#1a1a1a]/50">
          <div className="relative group">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text"
              placeholder="搜索节点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#222222] border border-white/5 rounded-md py-1.5 pl-8 pr-8 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        
        {/* Nodes list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingNodes ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="p-8 text-xs text-zinc-500 text-center flex flex-col items-center gap-2">
              <Search size={24} className="opacity-20" />
              <span>{searchQuery ? '没有找到匹配的节点' : '当前空间暂无节点'}</span>
            </div>
          ) : (
            <SidebarMenu className="px-2 py-1">
              {filteredNodes.map((node) => (
                <SidebarMenuItem key={node.id}>
                  <SidebarMenuButton 
                    onClick={() => handleSelectNode(node)}
                    className="group flex-col items-start py-3 h-auto border-b border-white/[0.03] last:border-0 pr-10"
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div className={`mt-1 p-1 rounded transition-colors ${
                        node.chatId 
                          ? 'bg-blue-500/10 text-blue-400 group-hover:text-blue-300' 
                          : 'bg-white/5 text-zinc-400 group-hover:text-white'
                      }`}>
                        <MessageSquare size={12} className={node.chatId ? 'fill-current' : ''} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium group-hover:text-white transition-colors">
                          {node.summaryQuestion || '未命名问题'}
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 w-full leading-relaxed">
                          {node.summaryAnswer || '暂无回答'}
                        </p>
                      </div>
                    </div>
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal size={14} />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                      >
                        <Trash size={14} className="mr-2" />
                        从画布中删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </div>
      </div>
    );
  }

  // Node detail view
  if (viewMode === 'detail' && selectedNode) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#1a1a1a] overflow-hidden relative" onMouseUp={handleMouseUp}>
        {/* Header with back button and navigation */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 bg-[#1a1a1a]">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-sm"
          >
            <ChevronLeft size={18} />
            <span>返回列表</span>
          </button>
          
          <span className="text-sm font-bold text-white flex-1 text-center">节点详情</span>
          
          <div className="flex items-center gap-2">
            {/* Previous/Next Navigation */}
            <button
              onClick={() => {
                const currentIndex = filteredNodes.findIndex(n => n.id === selectedNode.id);
                if (currentIndex > 0) {
                  handleSelectNode(filteredNodes[currentIndex - 1]);
                }
              }}
              disabled={filteredNodes.findIndex(n => n.id === selectedNode.id) === 0}
              className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="上一个节点"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                const currentIndex = filteredNodes.findIndex(n => n.id === selectedNode.id);
                if (currentIndex < filteredNodes.length - 1) {
                  handleSelectNode(filteredNodes[currentIndex + 1]);
                }
              }}
              disabled={filteredNodes.findIndex(n => n.id === selectedNode.id) === filteredNodes.length - 1}
              className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="下一个节点"
            >
              <ChevronRight size={20} />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-white/10 transition-colors text-zinc-500">
                  <MoreHorizontal size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:bg-destructive/10"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                <Trash size={14} className="mr-2" />
                从画布中删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        
        {/* Node content - Clean Reading Style */}
        <div 
          ref={detailContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {/* Question */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">问题</h3>
            <p className="text-[13px] font-semibold text-zinc-100 leading-relaxed">
              {selectedNode.fullQuestion || selectedNode.summaryQuestion}
            </p>
          </div>
          
          <div className="h-px w-full bg-white/5" />
          
          {/* Answer */}
          <div className="prose prose-invert prose-xs max-w-none text-zinc-300 leading-relaxed 
            prose-headings:text-sm prose-headings:mt-4 prose-headings:mb-2 
            prose-p:my-2 prose-hr:my-3 text-[13px] selection:bg-indigo-500/30">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedNode.fullAnswer || selectedNode.summaryAnswer || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        </div>

        {/* Floating Ask AI Button */}
        {selection && (
          <div 
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              left: `${selection.x}px`, 
              top: `${selection.y}px`, 
              transform: 'translate(-50%, -100%)' 
            }}
          >
            <button 
              onClick={handleAskAI}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap active:scale-95 transition-all"
            >
              <MessageSquarePlus size={14} />
              对此提问
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
