'use client';

import React, { useCallback } from 'react';
import { Trash2, Copy, X, Lock, Unlock, Minimize2, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface NodeContextMenuProps {
  id: string;
  top: number;
  left: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  isLocked?: boolean;
  isCollapsed?: boolean;
  onToggleLock?: (id: string) => void;
  onToggleCollapse?: (id: string) => void;
}

export function NodeContextMenu({ 
  id, 
  top, 
  left, 
  onClose, 
  onDelete,
  isLocked,
  isCollapsed,
  onToggleLock,
  onToggleCollapse 
}: NodeContextMenuProps) {
  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(id);
    onClose();
  }, [id, onClose]);

  const handleDelete = useCallback(() => {
    onDelete(id);
    onClose();
  }, [id, onDelete, onClose]);

  const handleToggleLock = useCallback(() => {
    onToggleLock?.(id);
    onClose();
  }, [id, onToggleLock, onClose]);

  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse?.(id);
    onClose();
  }, [id, onToggleCollapse, onClose]);

  return (
    <div
      className="fixed z-[1000] bg-[#252526] border border-white/10 rounded-lg shadow-2xl py-1 min-w-[160px] animate-in fade-in zoom-in duration-150"
      style={{ top, left }}
      onMouseLeave={onClose}
    >
      <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#858585] border-b border-white/5 mb-1 flex justify-between items-center">
        节点操作
        <button onClick={onClose} className="hover:text-white transition-colors">
            <X size={12} />
        </button>
      </div>
      
      {/* Toggle Lock */}
      <button
        onClick={handleToggleLock}
        className="w-full px-3 py-2 text-left text-sm text-[#e0e0e0] hover:bg-[#37373d] flex items-center gap-2.5 transition-colors"
      >
        {isLocked ? (
          <>
            <Unlock size={14} className="text-amber-400" />
            解锁节点
          </>
        ) : (
          <>
            <Lock size={14} className="text-[#858585]" />
            锁定节点
          </>
        )}
      </button>

      {/* Toggle Collapse */}
      <button
        onClick={handleToggleCollapse}
        className="w-full px-3 py-2 text-left text-sm text-[#e0e0e0] hover:bg-[#37373d] flex items-center gap-2.5 transition-colors"
      >
        {isCollapsed ? (
          <>
            <Maximize2 size={14} className="text-[#858585]" />
            展开节点
          </>
        ) : (
          <>
            <Minimize2 size={14} className="text-[#858585]" />
            折叠节点
          </>
        )}
      </button>

      <div className="border-t border-white/5 my-1" />
      
      <button
        onClick={handleCopyId}
        className="w-full px-3 py-2 text-left text-sm text-[#e0e0e0] hover:bg-[#37373d] flex items-center gap-2.5 transition-colors"
      >
        <Copy size={14} className="text-[#858585]" />
        复制节点 ID
      </button>

      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-left text-sm text-[#f87171] hover:bg-[#ef4444]/10 flex items-center gap-2.5 transition-colors"
      >
        <Trash2 size={14} />
        删除节点
      </button>
    </div>
  );
}
