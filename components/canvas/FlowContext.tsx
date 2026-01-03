
'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { Edge, Node, useReactFlow, useNodes, useEdges } from 'reactflow';
import dagre from 'dagre';
import { ChatNodeData } from './CustomNode';

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320;
const nodeHeight = 180; // Fixed height for nodes

interface FlowContextType {
  streamAIAnswer: (nodeId: string, question: string, context?: string) => Promise<void>;
  openNodeDetail: (nodeId: string) => void;
  closeNodeDetail: () => void;
  isNodeDetailModalOpen: boolean;
  selectedNodeForDetail: Node<ChatNodeData> | null;
  onUpdateNode: (id: string, fullQuestion: string, fullAnswer: string) => void;
  onGenerateAnswer: (id: string, fullQuestion: string) => void;
  onCreateChildNode: (parentId: string, selectionText: string) => void;
  onMarkText: (id: string, selectionText: string) => void;
  handleTidyUp: () => void;
  saveNodePositions?: (nodes: Node<ChatNodeData>[]) => Promise<void>;
}

const FlowContext = createContext<FlowContextType | null>(null);

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) throw new Error('useFlow must be used within FlowProvider');
  return context;
};

export const FlowProvider = ({
  children,
  streamAIAnswer,
  saveNodePositions,
}: {
  children: ReactNode;
  streamAIAnswer: (nodeId: string, question: string, context?: string) => Promise<void>;
  onCreateChildNode: (parentId: string, selectionText: string) => void; 
  saveNodePositions?: (nodes: Node<ChatNodeData>[]) => Promise<void>;
}) => {
  const [isNodeDetailModalOpen, setIsNodeDetailModalOpen] = useState(false);
  const [selectedNodeForDetail, setSelectedNodeForDetail] = useState<Node<ChatNodeData> | null>(null);

  const { setNodes, setEdges, getNodes, getEdges, fitView } = useReactFlow();
  const nodes = useNodes<ChatNodeData>();
  const edges = useEdges();

  const openNodeDetail = useCallback((nodeId: string) => {
    const node = getNodes().find((n) => n.id === nodeId);
    if (node) {
      setSelectedNodeForDetail(node as Node<ChatNodeData>);
      setIsNodeDetailModalOpen(true);
    }
  }, [getNodes]);

  const closeNodeDetail = useCallback(() => {
    setIsNodeDetailModalOpen(false);
    setSelectedNodeForDetail(null);
  }, []);

  const onUpdateNode = useCallback(
    (id: string, fullQuestion: string, fullAnswer: string) => { // Updated parameters
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            // it's important to create a new object here, otherwise React Flow won't know a thing has changed
            node.data = { ...node.data, fullQuestion, fullAnswer }; // Update fullQuestion and fullAnswer
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const onGenerateAnswer = useCallback(
    (id: string, fullQuestion: string) => { // Updated parameters
      streamAIAnswer(id, fullQuestion); // Use fullQuestion
      // Optionally update node question immediately, answer will stream later
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            // Update fullQuestion and set fullAnswer to a thinking state
            node.data = { ...node.data, fullQuestion, fullAnswer: 'AI is thinking...' };
          }
          return node;
        })
      );
    },
    [streamAIAnswer, setNodes]
  );

  const onCreateChildNode = useCallback(
    (parentId: string, selectionText: string) => {
      // This will be implemented in FlowCanvas, which has access to addNode etc.
      // For now, we'll just close the modal and pass relevant info.
      console.log(`Creating child node for parent ${parentId} with text: ${selectionText}`);
      closeNodeDetail();
      // A more robust implementation would involve creating the node and edge here or passing a callback
    },
    [closeNodeDetail]
  );

  const onMarkText = useCallback(
    (id: string, selectionText: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            const currentHighlights = node.data.highlights || [];
            // Prevent duplicate highlights
            if (!currentHighlights.includes(selectionText)) {
              node.data = { ...node.data, highlights: [...currentHighlights, selectionText] };
            }
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const getLayoutedElements = useCallback((nodes: Node<ChatNodeData>[], edges: Edge[]) => {
    dagreGraph.setGraph({
        rankdir: 'LR',
        align: 'UL',
        nodesep: 50, // horizontal distance between nodes
        edgesep: 10, // vertical distance between edges
        ranksep: 150, // vertical distance between ranks
    });
  
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
  
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
  
    dagre.layout(dagreGraph);
  
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      // We are shifting the dagre node position (anchor=center) to the top-left
      // so it matches React Flow's node anchor point.
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
  
      return node;
    });
  
    return { nodes: layoutedNodes, edges };
  }, []);

  const handleTidyUp = useCallback(async () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
  
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  
    // Persist node positions to database
    if (saveNodePositions) {
      try {
        await saveNodePositions(layoutedNodes);
      } catch (err) {
        console.error('Failed to save node positions after tidy up', err);
      }
    }

    window.requestAnimationFrame(() => {
      fitView();
    });
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges, fitView, saveNodePositions]);

  const contextValue = useMemo(
    () => ({
      streamAIAnswer,
      openNodeDetail,
      closeNodeDetail,
      isNodeDetailModalOpen,
      selectedNodeForDetail,
      onUpdateNode,
      onGenerateAnswer,
      onCreateChildNode,
      onMarkText,
      handleTidyUp,
    }),
    [
      streamAIAnswer,
      openNodeDetail,
      closeNodeDetail,
      isNodeDetailModalOpen,
      selectedNodeForDetail,
      onUpdateNode,
      onGenerateAnswer,
      onCreateChildNode,
      onMarkText,
      handleTidyUp,
    ]
  );

  return <FlowContext.Provider value={contextValue}>{children}</FlowContext.Provider>;
};
