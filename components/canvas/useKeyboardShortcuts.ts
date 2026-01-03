'use client';

import { useCallback, useEffect } from 'react';
import { useReactFlow, Node } from 'reactflow';
import { toPng, toSvg } from 'html-to-image';
import { toast } from 'sonner';

interface UseKeyboardShortcutsProps {
  onDeleteNodes: (nodeIds: string[]) => void;
  onSelectAll: () => void;
  onFitView: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts({
  onDeleteNodes,
  onSelectAll,
  onFitView,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsProps) {
  const { getNodes, setNodes, fitView } = useReactFlow();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const isMeta = event.metaKey || event.ctrlKey;

    // Delete selected nodes
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedNodes = getNodes().filter((n) => n.selected);
      if (selectedNodes.length > 0) {
        event.preventDefault();
        onDeleteNodes(selectedNodes.map((n) => n.id));
      }
    }

    // Select all (Ctrl/Cmd + A)
    if (isMeta && event.key === 'a') {
      event.preventDefault();
      onSelectAll();
    }

    // Fit view (Ctrl/Cmd + 0)
    if (isMeta && event.key === '0') {
      event.preventDefault();
      onFitView();
    }

    // Undo (Ctrl/Cmd + Z)
    if (isMeta && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      onUndo?.();
    }

    // Redo (Ctrl/Cmd + Shift + Z)
    if (isMeta && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      onRedo?.();
    }

    // Escape to deselect all
    if (event.key === 'Escape') {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    }

    // Arrow keys for nudging selected nodes
    const nudgeAmount = event.shiftKey ? 10 : 1;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const selectedNodes = getNodes().filter((n) => n.selected);
      if (selectedNodes.length > 0) {
        event.preventDefault();
        const delta = {
          x: event.key === 'ArrowLeft' ? -nudgeAmount : event.key === 'ArrowRight' ? nudgeAmount : 0,
          y: event.key === 'ArrowUp' ? -nudgeAmount : event.key === 'ArrowDown' ? nudgeAmount : 0,
        };
        setNodes((nds) =>
          nds.map((n) =>
            n.selected
              ? { ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } }
              : n
          )
        );
      }
    }
  }, [getNodes, setNodes, onDeleteNodes, onSelectAll, onFitView, onUndo, onRedo]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Export canvas as image
export async function exportCanvasAsImage(format: 'png' | 'svg' = 'png') {
  const flowElement = document.querySelector('.react-flow') as HTMLElement;
  if (!flowElement) {
    toast.error('无法导出画布');
    return;
  }

  try {
    const dataUrl = format === 'png' 
      ? await toPng(flowElement, { 
          backgroundColor: '#1e1e1e',
          quality: 1,
          pixelRatio: 2,
        })
      : await toSvg(flowElement, { 
          backgroundColor: '#1e1e1e',
        });
    
    const link = document.createElement('a');
    link.download = `canvas-export.${format}`;
    link.href = dataUrl;
    link.click();
    toast.success(`画布已导出为 ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('导出失败');
  }
}
