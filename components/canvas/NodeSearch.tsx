'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Node, useReactFlow } from 'reactflow';
import { clsx } from 'clsx';

interface NodeSearchProps {
  nodes: Node[];
  onFocusNode: (nodeId: string) => void;
}

export function NodeSearch({ nodes, onFocusNode }: NodeSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  // Filter nodes based on query
  const filteredNodes = nodes.filter((node) => {
    if (!query.trim()) return false;
    const data = node.data as any;
    const searchText = `${data.summaryQuestion || ''} ${data.summaryAnswer || ''} ${data.fullQuestion || ''} ${data.fullAnswer || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredNodes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredNodes[selectedIndex]) {
      e.preventDefault();
      handleSelectNode(filteredNodes[selectedIndex].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }, [filteredNodes, selectedIndex]);

  // Select and focus on node
  const handleSelectNode = useCallback((nodeId: string) => {
    onFocusNode(nodeId);
    setIsOpen(false);
    setQuery('');
  }, [onFocusNode]);

  // Global keyboard shortcut (Ctrl/Cmd + F)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "absolute z-[100] p-2 bg-[#282828]/95 backdrop-blur-md border border-white/15 rounded-lg text-[#e0e0e0] hover:bg-white/10 transition-all",
          "top-4 left-4", // Mobile: Left
          "sm:left-auto sm:right-4" // Desktop: Right
        )}
        title="搜索节点 (Ctrl+F)"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <div className={clsx(
      "absolute z-[100] bg-[#282828]/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl w-[90vw] max-w-[320px] overflow-hidden",
      "top-4 left-4", // Mobile
      "sm:left-auto sm:right-4 sm:w-[320px]" // Desktop
    )}>
      {/* Search Input */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <Search size={16} className="text-[#888]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索节点内容..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#666]"
          autoFocus
        />
        <button onClick={() => { setIsOpen(false); setQuery(''); }} className="text-[#888] hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="max-h-[300px] overflow-y-auto">
          {filteredNodes.length === 0 ? (
            <div className="p-4 text-center text-[#888] text-sm">未找到匹配的节点</div>
          ) : (
            filteredNodes.map((node, index) => {
              const data = node.data as any;
              return (
                <button
                  key={node.id}
                  onClick={() => handleSelectNode(node.id)}
                  className={clsx(
                    'w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0',
                    index === selectedIndex && 'bg-white/10'
                  )}
                >
                  <div className="text-sm text-white truncate">{data.summaryQuestion || data.fullQuestion || '无标题'}</div>
                  <div className="text-xs text-[#888] truncate mt-0.5">{data.summaryAnswer || data.fullAnswer?.substring(0, 50) || ''}</div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Hint */}
      <div className="px-3 py-2 bg-white/5 text-[10px] text-[#666] flex items-center justify-between">
        <span>↑↓ 导航 · Enter 选择 · Esc 关闭</span>
        <span>{filteredNodes.length} 结果</span>
      </div>
    </div>
  );
}
