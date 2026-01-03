'use client';

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  Viewport,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
  ConnectionLineType,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import debounce from 'lodash.debounce';
import { sanitizeResponseJSON, stripPoliteFiller } from '@/lib/utils';
import { toast } from 'sonner';

import { Dock } from './Dock';
import { CustomNode } from './CustomNode';
import { FlowProvider, useFlow } from './FlowContext';
import { CustomEdge } from './CustomEdge';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeDetailModal } from './NodeDetailModal';
import { useKeyboardShortcuts, exportCanvasAsImage } from './useKeyboardShortcuts';
import { useUndoRedo } from './useUndoRedo';
import { NodeSearch } from './NodeSearch';
import { NodeTemplatePanel } from './NodeTemplatePanel';
import { TextNode } from './TextNode';
import { workspaceCache } from '@/lib/workspace-cache';
import { 
  getOrCreateUserWorkspace, 
  getWorkspaceDataAction, 
  updateWorkspaceSettingsAction, 
  createNodeAction, 
  updateNodeAction, 
  deleteNodeAction, 
  createEdgeAction 
} from '../../lib/actions/canvas';

const nodeTypes = {
  chatNode: CustomNode,
  textNode: TextNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export type FlowChatNodeData = {
  summaryQuestion: string;
  summaryAnswer: string;
  fullQuestion: string;
  fullAnswer: string;
  highlights?: string[]; 
  chatId?: string | null;
  isNew?: boolean;
  locked?: boolean;
  collapsed?: boolean;
};

function FlowInnerComponent({ workspaceId }: { workspaceId: string }) {
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const edgeTypesMemo = useMemo(() => edgeTypes, []);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false); // For Space + drag panning
  const miniMapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for Space key for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const { 
    isNodeDetailModalOpen, 
    selectedNodeForDetail, 
    closeNodeDetail,
    openNodeDetail, 
    onUpdateNode, 
    onGenerateAnswer, 
    onCreateChildNode, 
    onMarkText, 
    handleTidyUp, 
    streamAIAnswer 
  } = useFlow(); 

  const reactFlowInstance = useReactFlow();
  const isFirstLoad = useRef(true);
  
  // Undo/Redo functionality
  const { saveState, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Sync workspaceId to window for event helpers
  useEffect(() => {
    (window as any).__currentWorkspaceId = workspaceId;
  }, [workspaceId]);

  // Focus on a specific node (for search)
  const handleFocusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Select the node and center on it
      setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
      reactFlowInstance.setCenter(node.position.x + 160, node.position.y + 100, { 
        zoom: 1.5, 
        duration: 800 
      });
    }
  }, [nodes, setNodes, reactFlowInstance]);

  // Handle undo action
  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      toast.info('已撤销');
    }
  }, [undo, setNodes, setEdges]);

  // Handle redo action
  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      toast.info('已重做');
    }
  }, [redo, setNodes, setEdges]);


  const handleAddNode = useCallback(async (initialQuestion: string = 'New Question', initialAnswer: string = '', summaryData?: any) => {
    // 1. Prevent duplicates
    const cleanedInitialAnswer = stripPoliteFiller(initialAnswer);
    const existingNode = nodes.find(n => (n.data as FlowChatNodeData)?.fullAnswer === initialAnswer && initialAnswer !== '');
    
    if (existingNode) {
        // Just focus on it
        reactFlowInstance.setCenter(existingNode.position.x + 160, existingNode.position.y + 100, { zoom: 1.2, duration: 800 });
        setNodes((nds) => nds.map(n => n.id === existingNode.id ? { ...n, selected: true } : { ...n, selected: false }));
        return;
    }

    // 2. Calculate non-overlapping position (find the lowest node and place it below)
    let nextY = 0;
    if (nodes.length > 0) {
        const maxY = Math.max(...nodes.map(n => n.position.y));
        nextY = maxY + 350; // Add space
    } else {
        const { x, y, zoom } = reactFlowInstance.getViewport();
        nextY = (window.innerHeight / 2 - y) / zoom - 100;
    }
    
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = (window.innerWidth / 2 - x) / zoom;
    const finalX = nodes.length > 0 ? nodes[nodes.length - 1].position.x : centerX - 160;

    const tempId = `temp-${Date.now()}`;
    const simulatedSummaryQuestion = summaryData?.summaryQuestion || (initialQuestion.substring(0, 50) + (initialQuestion.length > 50 ? '...' : ''));
    const simulatedSummaryAnswer = summaryData?.summaryAnswer || (cleanedInitialAnswer.substring(0, 100) + (cleanedInitialAnswer.length > 100 ? '...' : ''));
    const chatId = summaryData?.chatId;

    // 3. Focus on the upcoming node position
    reactFlowInstance.setCenter(finalX + 160, nextY + 100, { zoom: 1, duration: 800 });

    // 4. Optimistic update
    setNodes((nds) => [
      ...nds.map(n => ({ ...n, selected: false })),
      {
        id: tempId,
        type: 'chatNode',
        position: { x: finalX, y: nextY },
        selected: true,
        data: { 
          summaryQuestion: simulatedSummaryQuestion,
          summaryAnswer: initialAnswer ? simulatedSummaryAnswer : "提炼中...",
          fullQuestion: initialQuestion,
          fullAnswer: initialAnswer,
          highlights: [],
          chatId,
          isNew: true
        },
      }
    ]);

    try {
        const newNodeResult = await createNodeAction({
            workspaceId,
            type: 'chatNode',
            positionX: finalX,
            positionY: nextY,
            summaryQuestion: simulatedSummaryQuestion,
            summaryAnswer: simulatedSummaryAnswer,
            fullQuestion: initialQuestion,
            fullAnswer: initialAnswer,
            highlights: [],
            chatId,
        });

        if (!newNodeResult) {
            setNodes(nds => nds.filter(n => n.id !== tempId));
            return;
        }

        // 5. Replace with real ID and data
        setNodes((nds) => nds.map(n => n.id === tempId ? {
          ...n,
          id: newNodeResult.id,
          data: { 
            summaryQuestion: newNodeResult.summaryQuestion!,
            summaryAnswer: newNodeResult.summaryAnswer!,
            fullQuestion: newNodeResult.fullQuestion!,
            fullAnswer: newNodeResult.fullAnswer!,
            highlights: [],
            chatId: newNodeResult.chatId,
            isNew: true
          },
        } : n));

        // Clear 'isNew' flag after animation
        setTimeout(() => {
           setNodes((nds) => nds.map(n => n.id === newNodeResult.id ? {
             ...n,
             data: { ...n.data, isNew: false }
           } : n));
        }, 5000);

        // 6. Trigger streaming
        if (initialQuestion === 'New Question' && !initialAnswer) {
          streamAIAnswer(newNodeResult.id, initialQuestion);
        } else if (summaryData?.isStreamingPromotion) {
          streamAIAnswer(newNodeResult.id, initialQuestion, initialAnswer);
        }

        // 7. Auto-link to the previous node (if any)
        if (nodes.length > 0) {
           const prevNode = nodes[nodes.length - 1];
           onConnectInternal({
             source: prevNode.id,
             target: newNodeResult.id,
             sourceHandle: 'bottom',
             targetHandle: 'top'
           });
        }
    } catch (error) {
        setNodes(nds => nds.filter(n => n.id !== tempId));
        console.error("Failed to add node", error);
    }
  }, [reactFlowInstance, workspaceId, nodes, setNodes, streamAIAnswer]);

  // Handle 'add-node' event from Sidebar promotion
  useEffect(() => {
    const handleAddNodeFromChat = (event: any) => {
        const { message, summary } = event.detail;
        if (summary) {
            handleAddNode(summary.summaryQuestion, message, summary);
        } else {
            // Fallback: 至少对问题标题进行脱水处理
            const cleanedQuestion = stripPoliteFiller(message);
            handleAddNode(cleanedQuestion, message);
        }
    };

    window.addEventListener('add-node', handleAddNodeFromChat);
    return () => window.removeEventListener('add-node', handleAddNodeFromChat);
  }, [handleAddNode]);

  // Handle text node updates
  useEffect(() => {
    const handleUpdateTextNode = async (event: any) => {
      const { id, text } = event.detail;
      
      // Update local state
      setNodes((nds) => nds.map((n) => 
        n.id === id 
          ? { ...n, data: { ...n.data, text } }
          : n
      ));
      
      // Persist to database (if not a temp node)
      if (!id.startsWith('temp-')) {
        try {
          await updateNodeAction({
            id,
            summaryQuestion: text,
            fullQuestion: text,
          });
        } catch (err) {
          console.error('Failed to save text node content:', err);
        }
      }
    };

    window.addEventListener('update-text-node', handleUpdateTextNode);
    return () => window.removeEventListener('update-text-node', handleUpdateTextNode);
  }, [setNodes]);

  // Listen for focus-node event from sidebar (for highlighting node on canvas)
  useEffect(() => {
    const handleFocusNode = (event: any) => {
      const { nodeId } = event.detail;
      const node = nodes.find(n => n.id === nodeId);
      if (node && reactFlowInstance) {
        // Center on node
        reactFlowInstance.setCenter(
          node.position.x + 170, // center of node
          node.position.y + 60,
          { zoom: 1.2, duration: 500 }
        );
        // Select the node
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
      }
    };

    window.addEventListener('focus-node', handleFocusNode);
    return () => window.removeEventListener('focus-node', handleFocusNode);
  }, [nodes, reactFlowInstance, setNodes]);

  // Listen for open-node-detail event from sidebar
  useEffect(() => {
    const handleOpenNodeDetail = (event: any) => {
      const { nodeId } = event.detail;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        openNodeDetail(node.id);
      }
    };

    window.addEventListener('open-node-detail', handleOpenNodeDetail);
    return () => window.removeEventListener('open-node-detail', handleOpenNodeDetail);
  }, [nodes, openNodeDetail]);

  // Handle node deletion from sidebar
  useEffect(() => {
    const handleNodeDeleted = (event: any) => {
      const { nodeId } = event.detail;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    };
    window.addEventListener('node-deleted-from-sidebar', handleNodeDeleted);
    return () => window.removeEventListener('node-deleted-from-sidebar', handleNodeDeleted);
  }, [setNodes]);

  // Save state to history when nodes/edges change significantly
  const saveHistoryDebounced = useMemo(
    () => debounce((n: Node[], e: Edge[]) => {
      if (n.length > 0 || e.length > 0) {
        saveState(n, e);
      }
    }, 500),
    [saveState]
  );

  const handleAddTextNode = useCallback(async () => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = (window.innerWidth / 2 - x) / zoom;
    const centerY = (window.innerHeight / 2 - y) / zoom;
    
    const finalX = centerX - 100;
    const finalY = centerY - 50;

    const tempId = `temp-${Date.now()}`;

    setNodes((nds) => [
      ...nds.map(n => ({ ...n, selected: false })),
      {
        id: tempId,
        type: 'textNode',
        position: { x: finalX, y: finalY },
        selected: true,
        data: { text: 'New Text', fontSize: 'md' },
      }
    ]);

    try {
        const newNodeResult = await createNodeAction({
            workspaceId,
            type: 'textNode',
            positionX: finalX,
            positionY: finalY,
            summaryQuestion: 'New Text',
            fullAnswer: JSON.stringify({ fontSize: 'md' }),
        });

        if (newNodeResult) {
            setNodes((nds) => nds.map(n => n.id === tempId ? {
              ...n,
              id: newNodeResult.id,
              data: { text: 'New Text', fontSize: 'md' },
            } : n));
        }
    } catch (error) {
        setNodes(nds => nds.filter(n => n.id !== tempId));
        toast.error('添加文本失败');
    }
  }, [reactFlowInstance, workspaceId, setNodes]);


  const prevNodeCount = useRef(0);

  // Notify sidebar whenever nodes list changes
  const debouncedNotifySidebar = useMemo(
    () => debounce((nds: any[], wsId: string) => {
      window.dispatchEvent(new CustomEvent('nodes-updated', { 
        detail: { nodes: nds, workspaceId: wsId } 
      }));
    }, 100),
    []
  );

  useEffect(() => {
    debouncedNotifySidebar(nodes, workspaceId);
    
    // Save history on structural changes
    if (nodes.length !== prevNodeCount.current) {
      saveHistoryDebounced(nodes, edges);
      prevNodeCount.current = nodes.length;
    }
  }, [nodes, workspaceId, edges.length, saveHistoryDebounced, debouncedNotifySidebar]);


  // Load Workspace Data with cache support
  useEffect(() => {
    let ignore = false;
    async function loadData() {
        if (!workspaceId) return;
        
        // Notify sidebar we are switching/loading removed, 
        // handleNodesUpdated already ignores empty lists if it has cache.

        // Check cache first for instant load
        const cachedData = workspaceCache.get(workspaceId);
        if (cachedData && cachedData.nodes.length > 0) {
            console.log(`[FlowCanvas] ID: ${workspaceId} - Loading from cache: ${cachedData.nodes.length} nodes`);
            setNodes(cachedData.nodes);
            setEdges(cachedData.edges);
            
            if (isFirstLoad.current && cachedData.viewport) {
                reactFlowInstance.setViewport(cachedData.viewport);
                isFirstLoad.current = false;
            }
            
            // Fetch fresh data in background (stale-while-revalidate)
            getWorkspaceDataAction(workspaceId).then((data) => {
                if (ignore) return;
                if (data) {
                    console.log(`[FlowCanvas] ID: ${workspaceId} - Background refresh: ${data.nodes.length} nodes from server`);
                    const freshNodes = formatNodes(data.nodes);
                    const freshEdges = formatEdges(data.edges);
                    setNodes(freshNodes);
                    setEdges(freshEdges);
                    
                    // Dispatch fresh nodes to sidebar handled by useEffect now

                    // Update cache
                    const settings = data.workspace.settings as any;
                    workspaceCache.set(workspaceId, {
                        nodes: freshNodes,
                        edges: freshEdges,
                        viewport: settings?.viewport,
                    });
                }
            }).catch(() => {});
            return;
        } else if (cachedData && cachedData.nodes.length === 0) {
            console.log(`[FlowCanvas] ID: ${workspaceId} - Cache contains 0 nodes, forcing full fetch.`);
        }
        
        // No cache - fetch from server
        try {
            console.log(`[FlowCanvas] ID: ${workspaceId} - No cache, fetching from server...`);
            const data = await getWorkspaceDataAction(workspaceId);
            if (ignore) return;
            if (data) {
                console.log(`[FlowCanvas] ID: ${workspaceId} - Received ${data.nodes.length} raw nodes from server`);
                const formattedNodes = formatNodes(data.nodes);
                const formattedEdges = formatEdges(data.edges);
                
                console.log(`[FlowCanvas] ID: ${workspaceId} - Formatted into ${formattedNodes.length} React Flow nodes`);
                
                setNodes(formattedNodes);
                setEdges(formattedEdges);
                
                // Dispatch to sidebar handled by useEffect now

                const settings = data.workspace.settings as any;
                
                // Store in cache
                workspaceCache.set(workspaceId, {
                    nodes: formattedNodes,
                    edges: formattedEdges,
                    viewport: settings?.viewport,
                });
                  
                if (isFirstLoad.current) {
                    if (settings?.viewport) {
                        reactFlowInstance.setViewport(settings.viewport);
                    }
                    isFirstLoad.current = false;
                }
            }
        } catch (error) {
            console.error("Failed to load workspace data", error);
        }
    }
    
    // Helper to format nodes from DB
    function formatNodes(nodes: any[]): Node<any>[] {
        return nodes.map((n: any) => {
            if (n.type === 'textNode') {
                let fontSize = 'md';
                try {
                    const settings = JSON.parse(n.fullAnswer || '{}');
                    fontSize = settings.fontSize || 'md';
                } catch {}
                
                return {
                    id: n.id,
                    type: 'textNode',
                    position: { x: n.positionX, y: n.positionY },
                    data: { text: n.summaryQuestion || n.fullQuestion || '', fontSize },
                };
            }
            
            return {
                id: n.id,
                type: n.type || 'chatNode',
                position: { x: n.positionX, y: n.positionY },
                data: { 
                    summaryQuestion: n.summaryQuestion,
                    summaryAnswer: n.summaryAnswer,
                    fullQuestion: n.fullQuestion,
                    fullAnswer: n.fullAnswer,
                    highlights: n.highlights || [],
                    chatId: n.chatId
                },
            };
        });
    }
    
    // Helper to format edges from DB
    function formatEdges(edges: any[]): Edge[] {
        return edges.map((e: any) => ({
            id: e.id,
            source: e.sourceNodeId,
            target: e.targetNodeId,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: 'custom',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
        }));
    }
    
    loadData();
    return () => { ignore = true; };
  }, [workspaceId, setNodes, setEdges, reactFlowInstance]);

  const debouncedSaveViewport = useMemo(
    () => debounce((vp: Viewport) => {
        updateWorkspaceSettingsAction(workspaceId, { viewport: vp });
    }, 1000),
    [workspaceId]
  );

  const onMoveEnd = useCallback((event: any, viewport: Viewport) => {
    setZoomLevel(viewport.zoom);
    showMiniMapCallback();
    debouncedSaveViewport(viewport);
  }, [debouncedSaveViewport]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ id: node.id, top: event.clientY, left: event.clientX });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteNode = useCallback(async (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    try {
        await deleteNodeAction(id);
    } catch (err) {
        toast.error("Failed to delete node");
    }
  }, [setNodes, setEdges]);

  const handleToggleLock = useCallback((id: string) => {
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, locked: !n.data.locked } } : n
    ));
    // Optionally persist to DB here
  }, [setNodes]);

  const handleToggleCollapse = useCallback((id: string) => {
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n
    ));
    // Optionally persist to DB here
  }, [setNodes]);

  const onNodeDragStop = useCallback(async (event: React.MouseEvent, node: Node, selectedNodes: Node[]) => {
      // When multi-select dragging, selectedNodes contains all dragged nodes
      const nodesToSave = selectedNodes.length > 1 ? selectedNodes : [node];
      
      // Filter out temp nodes only (text nodes are now persisted)
      const savePromises = nodesToSave
        .filter(n => !n.id.startsWith('temp-'))
        .map(n => updateNodeAction({ 
            id: n.id, 
            positionX: n.position.x, 
            positionY: n.position.y 
        }));
      
      if (savePromises.length > 0) {
        try {
            await Promise.all(savePromises);
        } catch (err) {
            console.error("Failed to save node positions", err);
        }
      }
  }, []);

  const showMiniMapCallback = useCallback(() => {
    setIsMiniMapVisible(true);
    if (miniMapTimerRef.current) clearTimeout(miniMapTimerRef.current);
    miniMapTimerRef.current = setTimeout(() => setIsMiniMapVisible(false), 2000);
  }, []);

  const onConnectInternal = useCallback(async (params: Connection) => {
    // Check for duplicate edges
    const existingEdge = edges.find(e => 
      e.source === params.source && 
      e.target === params.target &&
      e.sourceHandle === params.sourceHandle &&
      e.targetHandle === params.targetHandle
    );
    
    if (existingEdge) {
      toast.info('连接已存在');
      return;
    }

    const newEdge = { 
        ...params, 
        type: 'custom',
        animated: true, 
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ffffff',
        },
    };
    setEdges((eds) => addEdge(newEdge, eds));
    
    try {
      await createEdgeAction({
          workspaceId,
          sourceNodeId: params.source!,
          targetNodeId: params.target!,
          sourceHandle: params.sourceHandle || undefined,
          targetHandle: params.targetHandle || undefined
      });
    } catch (err) {
      console.error('Failed to save edge:', err);
      toast.error('保存连接失败');
    }
  }, [setEdges, workspaceId, edges]);

  // Handle drag & drop from template panel
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    const data = e.dataTransfer.getData('application/reactflow');
    if (!data) return;
    
    try {
      const template = JSON.parse(data);
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      
      // Handle text node with DB persistence
      if (template.type === 'textNode') {
        const tempId = `temp-text-${Date.now()}`;
        setNodes((nds) => [
          ...nds,
          {
            id: tempId,
            type: 'textNode',
            position,
            data: template.data,
          },
        ]);
        
        // Persist text node to database
        try {
          const newTextNode = await createNodeAction({
            workspaceId,
            type: 'textNode',
            positionX: position.x,
            positionY: position.y,
            summaryQuestion: template.data.text || '',  // Store text in summaryQuestion field
            summaryAnswer: '',
            fullQuestion: template.data.text || '',
            fullAnswer: JSON.stringify({ fontSize: template.data.fontSize || 'md' }),  // Store settings in fullAnswer
            highlights: [],
          });
          
          if (newTextNode) {
            setNodes((nds) => nds.map((n) =>
              n.id === tempId ? { ...n, id: newTextNode.id } : n
            ));
          }
        } catch (err) {
          console.error('Failed to save text node:', err);
        }
        return;
      }

      // Handle chatNode with DB persistence
      const tempId = `temp-${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id: tempId,
          type: 'chatNode',
          position,
          data: {
            ...template.data,
            isNew: true,
          },
        },
      ]);

      // Persist to database
      const newNodeResult = await createNodeAction({
        workspaceId,
        type: 'chatNode',
        positionX: position.x,
        positionY: position.y,
        summaryQuestion: template.data.summaryQuestion,
        summaryAnswer: template.data.summaryAnswer,
        fullQuestion: template.data.fullQuestion || template.data.summaryQuestion,
        fullAnswer: template.data.fullAnswer || '',
        highlights: [],
      });

      if (newNodeResult) {
        setNodes((nds) => nds.map((n) =>
          n.id === tempId
            ? { ...n, id: newNodeResult.id }
            : n
        ));
        
        // Clear isNew flag after animation
        setTimeout(() => {
          setNodes((nds) => nds.map((n) =>
            n.id === newNodeResult.id
              ? { ...n, data: { ...n.data, isNew: false } }
              : n
          ));
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  }, [reactFlowInstance, workspaceId, setNodes]);

  // Keyboard shortcut handlers
  const handleDeleteNodes = useCallback(async (nodeIds: string[]) => {
    // Remove from local state
    setNodes((nds) => nds.filter((n) => !nodeIds.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)));
    
    // Delete persisted nodes from database (filter out only temp nodes)
    const persistedNodeIds = nodeIds.filter(id => !id.startsWith('temp-'));
    
    if (persistedNodeIds.length > 0) {
      try {
        await Promise.all(persistedNodeIds.map((id) => deleteNodeAction(id)));
        toast.success(`已删除 ${nodeIds.length} 个节点`);
      } catch (err) {
        toast.error('删除失败');
      }
    } else {
      toast.success(`已删除 ${nodeIds.length} 个节点`);
    }
  }, [setNodes, setEdges]);

  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlowInstance]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onDeleteNodes: handleDeleteNodes,
    onSelectAll: handleSelectAll,
    onFitView: handleFitView,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  return (
    <div className={`w-full h-full bg-[#1e1e1e] relative ${isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypesMemo}
        edgeTypes={edgeTypesMemo}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectInternal}
        onNodeContextMenu={onNodeContextMenu}
        onMoveStart={showMiniMapCallback}
        onMove={showMiniMapCallback}
        onMoveEnd={onMoveEnd}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        connectionLineStyle={{ stroke: '#ffffff', strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.Bezier}
        defaultEdgeOptions={{
            type: 'custom',
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#ffffff',
            },
        }}
        selectionOnDrag={!isSpacePressed}
        selectionMode={SelectionMode.Partial}
        panOnDrag={isSpacePressed ? [0, 1, 2] : [1, 2]}  // Space+left click, middle, or right-click for panning
        selectNodesOnDrag={!isSpacePressed}
        snapToGrid={true}
        snapGrid={[25, 25]}  // Matches background dot gap
        onDrop={onDrop}
        onDragOver={onDragOver}
        proOptions={{ hideAttribution: true }}
      >
      <Background variant={BackgroundVariant.Dots} gap={25} size={2} color="#555" />
      <div className="transition-opacity duration-500 pointer-events-none" style={{ opacity: isMiniMapVisible ? 1 : 0 }}>
          <MiniMap 
            nodeStrokeColor="#444" 
            nodeColor="#333" 
            maskColor="rgba(0, 0, 0, 0.7)" 
            className="rounded-xl border border-white/5 !bg-[#121212]/90"
          />
      </div>
      </ReactFlow>
      
      {contextMenu && (() => {
        const node = nodes.find(n => n.id === contextMenu.id);
        return (
          <NodeContextMenu 
            {...contextMenu} 
            onClose={() => setContextMenu(null)} 
            onDelete={handleDeleteNode}
            isLocked={node?.data?.locked}
            isCollapsed={node?.data?.collapsed}
            onToggleLock={handleToggleLock}
            onToggleCollapse={handleToggleCollapse}
          />
        );
      })()} 

      {/* Node Search removed */}

      <Dock 
        onAddNode={handleAddNode} 
        onAddText={handleAddTextNode}
        onTidyUp={handleTidyUp} 
        onZoomToFit={() => reactFlowInstance.fitView({ padding: 0.2, duration: 800 })} 
        zoomLevel={zoomLevel} 
        onZoomChange={(v) => { reactFlowInstance.zoomTo(v); setZoomLevel(v); }} 
        onExport={exportCanvasAsImage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Node Template Panel removed */}

      <NodeDetailModal
        isOpen={isNodeDetailModalOpen}
        onClose={closeNodeDetail}
        node={selectedNodeForDetail ? { 
          id: selectedNodeForDetail.id, 
          data: { 
            fullQuestion: selectedNodeForDetail.data.fullQuestion, 
            fullAnswer: selectedNodeForDetail.data.fullAnswer,
            highlights: selectedNodeForDetail.data.highlights || []
          }
        } : null}
        onUpdateNode={(id, question, answer) => onUpdateNode(id, question, answer)} 
        onGenerateAnswer={(id, question) => onGenerateAnswer(id, question)} 
        onCreateChildNode={onCreateChildNode} 
        onMarkText={onMarkText}
      />
    </div>
  );
}

export function FlowCanvas({ workspaceId: propWorkspaceId }: { workspaceId?: string }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(propWorkspaceId || null);

  useEffect(() => {
    if (propWorkspaceId) {
      setWorkspaceId(propWorkspaceId);
      return;
    }
    async function init() {
        try {
            const ws = await getOrCreateUserWorkspace();
            if (ws) setWorkspaceId(ws.id);
        } catch (error) {
            console.error("Failed to init workspace", error);
        }
    }
    init();
  }, [propWorkspaceId]);

  return (
    <FlowWithProvider workspaceId={workspaceId} />
  );
}

function FlowWithProvider({ workspaceId }: { workspaceId: string | null }) {
    const reactFlowInstance = useReactFlow();

    const handleStreamAIAnswer = useCallback(async (nodeId: string, question: string, context?: string) => {
        try {
            console.log(`[Flow] Starting AI Stream for Node: ${nodeId}`);
            console.log(`[Flow] Question: "${question}"`);
            
            // UI Feedback
            reactFlowInstance.setNodes((nds) => nds.map(n => n.id === nodeId ? { 
                ...n, 
                data: { ...n.data, fullAnswer: '', fullQuestion: question, summaryAnswer: '洞察实时提取中...' } 
            } : n));

            const response = await fetch('/api/canvas/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [{ role: 'user', content: question }],
                    context,
                    mode: 'stream'
                }),
            });
            
            if (!response.ok) throw new Error("API call failed");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let isParsingSummary = false;
            let summaryBuffer = '';
            const SEPARATOR = "__JSON_SUMMARY__";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
        
                    const chunk = decoder.decode(value, { stream: true });
                    fullText += chunk;

                    if (!isParsingSummary && fullText.includes(SEPARATOR)) {
                        const parts = fullText.split(SEPARATOR);
                        const mainAnswer = parts[0];
                        isParsingSummary = true;
                        summaryBuffer = parts[1] || '';
                        
                        reactFlowInstance.setNodes((nds) => nds.map(n => n.id === nodeId ? { 
                            ...n, 
                            data: { ...n.data, fullAnswer: mainAnswer.trim() } 
                        } : n));
                    } else if (!isParsingSummary) {
                        const currentFullAnswer = fullText.trim();
                        // 正在生成详细答案时，仅在节点显示极简预览
                        reactFlowInstance.setNodes((nds) => nds.map(n => n.id === nodeId ? { 
                            ...n, 
                            data: { 
                                ...n.data, 
                                fullAnswer: currentFullAnswer,
                                summaryAnswer: (stripPoliteFiller(currentFullAnswer).substring(0, 60) + (currentFullAnswer.length > 60 ? '...' : '')) || '分析中...'
                            } 
                        } : n));
                    } else {
                        summaryBuffer += chunk;
                    }
                }
            }

            console.log(`[Flow] Stream Complete for Node: ${nodeId}. Length: ${fullText.length} chars.`);

            let finalSummary = { 
                summaryQuestion: question.length > 30 ? question.substring(0, 30) + '...' : question, 
                summaryAnswer: '' 
            };
            const mainAnswer = isParsingSummary ? fullText.split(SEPARATOR)[0].trim() : fullText.trim();

            if (isParsingSummary && summaryBuffer) {
                console.group(`[Flow] AI Distillation Result - Node ${nodeId}`);
                console.log("Raw Summary Buffer:", summaryBuffer);
                try {
                    const parsed = JSON.parse(sanitizeResponseJSON(summaryBuffer));
                    console.log("Parsed JSON:", parsed);
                    // 直接使用 AI 提取的极简字段，避免二次处理
                    finalSummary.summaryQuestion = parsed.summaryQuestion || finalSummary.summaryQuestion;
                    finalSummary.summaryAnswer = parsed.summaryAnswer || mainAnswer;
                    console.log("✅ Final Distilled Topic:", finalSummary.summaryQuestion);
                    console.log("✅ Final Distilled Insight:", finalSummary.summaryAnswer);
                } catch (e) {
                    console.error("❌ Failed to parse summary JSON:", e);
                    finalSummary.summaryAnswer = mainAnswer;
                }
                console.groupEnd();
            } else {
                console.log("[Flow] No separate JSON summary found. Using truncated answer.");
                finalSummary.summaryAnswer = mainAnswer;
            }

            reactFlowInstance.setNodes((nds) => nds.map(n => n.id === nodeId ? { 
                ...n, 
                data: { 
                    ...n.data,
                    summaryQuestion: finalSummary.summaryQuestion,
                    summaryAnswer: finalSummary.summaryAnswer,
                    fullAnswer: mainAnswer
                } 
            } : n));

            await updateNodeAction({ 
                id: nodeId, 
                summaryQuestion: finalSummary.summaryQuestion,
                summaryAnswer: finalSummary.summaryAnswer,
                fullAnswer: mainAnswer,
                fullQuestion: question
            });

        } catch (e) {
            console.error(`[Flow] Error in handleStreamAIAnswer for Node ${nodeId}:`, e);
            reactFlowInstance.setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, fullAnswer: '抱歉，生成内容时出错了。' } } : n));
        }
    }, [reactFlowInstance]);

    const handleCreateChildNode = useCallback(async (parentId: string, selectionText: string) => {
         const parentNode = reactFlowInstance.getNode(parentId);
         if (!parentNode || !workspaceId) return;

         const simulatedSummaryQuestion = selectionText.substring(0, 50) + (selectionText.length > 50 ? '...' : '');
         
         const newNodeResult = await createNodeAction({
             workspaceId,
             type: 'chatNode',
             positionX: parentNode.position.x + 400,
             positionY: parentNode.position.y + 50,
             summaryQuestion: simulatedSummaryQuestion,
             summaryAnswer: "正在分析关联上下文...",
             fullQuestion: selectionText,
             fullAnswer: "",
             highlights: [],
         });

         if (newNodeResult) {
            const newNode = {
                id: newNodeResult.id,
                type: 'chatNode',
                position: { x: newNodeResult.positionX, y: newNodeResult.positionY },
                data: { 
                    summaryQuestion: newNodeResult.summaryQuestion!,
                    summaryAnswer: newNodeResult.summaryAnswer!,
                    fullQuestion: newNodeResult.fullQuestion!,
                    fullAnswer: newNodeResult.fullAnswer!,
                    highlights: []
                },
            };
            
            reactFlowInstance.addNodes(newNode);

            const newEdgeResult = await createEdgeAction({
                workspaceId,
                sourceNodeId: parentId,
                targetNodeId: newNodeResult.id,
                sourceHandle: 'right'
            });

            if (newEdgeResult) {
                reactFlowInstance.addEdges({
                    id: newEdgeResult.id,
                    source: parentId,
                    target: newNodeResult.id,
                    sourceHandle: 'right',
                    animated: true,
                    style: { stroke: '#666', strokeWidth: 2 }
                });
            }
            
            const highlights = parentNode.data.highlights || [];
            if (!highlights.includes(selectionText)) {
                await updateNodeAction({ id: parentId, highlights: [...highlights, selectionText] });
                reactFlowInstance.setNodes((nds) => nds.map(n => n.id === parentId ? { ...n, data: { ...n.data, highlights: [...highlights, selectionText] } } : n));
            }

            handleStreamAIAnswer(newNodeResult.id, selectionText, parentNode.data.fullAnswer);
         }
    }, [reactFlowInstance, workspaceId, handleStreamAIAnswer]);

    // Callback to save all node positions (used by handleTidyUp)
    const handleSaveNodePositions = useCallback(async (nodes: Node<any>[]) => {
        const savePromises = nodes
            .filter(node => !node.id.startsWith('temp-'))
            .map(node => updateNodeAction({ 
                id: node.id, 
                positionX: node.position.x, 
                positionY: node.position.y 
            }));
        await Promise.all(savePromises);
    }, []);

    if (!workspaceId) return <div className="flex items-center justify-center h-full text-white">Loading Workspace...</div>;

    return (
        <FlowProvider 
            streamAIAnswer={handleStreamAIAnswer}
            onCreateChildNode={handleCreateChildNode}
            saveNodePositions={handleSaveNodePositions}
        >
            <FlowInnerComponent workspaceId={workspaceId} />
        </FlowProvider>
    );
}
