'use client';

import { useCallback, useRef, useState } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY_SIZE = 50;

export function useUndoRedo() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isUndoRedoAction = useRef(false);

  // Save current state to history
  const saveState = useCallback((nodes: Node[], edges: Edge[]) => {
    // Don't save if this change was triggered by undo/redo
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    // Remove any future history if we're not at the end
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(newState);
    
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }

    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Undo action
  const undo = useCallback((): HistoryState | null => {
    if (currentIndexRef.current <= 0) return null;
    
    isUndoRedoAction.current = true;
    currentIndexRef.current--;
    
    const state = historyRef.current[currentIndexRef.current];
    
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(true);
    
    return state;
  }, []);

  // Redo action
  const redo = useCallback((): HistoryState | null => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return null;
    
    isUndoRedoAction.current = true;
    currentIndexRef.current++;
    
    const state = historyRef.current[currentIndexRef.current];
    
    setCanUndo(true);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    
    return state;
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    saveState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  };
}
