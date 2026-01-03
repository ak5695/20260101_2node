
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { RefreshCw, Maximize2, Lock } from 'lucide-react';
import { useFlow } from './FlowContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the data structure for our node (pure data)
export type ChatNodeData = {
  summaryQuestion: string;
  summaryAnswer: string;
  fullQuestion: string;
  fullAnswer: string;
  highlights?: string[]; 
  isNew?: boolean;
  locked?: boolean;      // Prevents node from being moved
  collapsed?: boolean;   // Collapses node to minimal view
};

function CustomNodeComponent({ id, data, selected }: NodeProps<ChatNodeData>) {
  const { streamAIAnswer, openNodeDetail } = useFlow();
  const answerRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch event to open detail in sidebar instead of modal
    window.dispatchEvent(new CustomEvent('request-node-detail', { 
      detail: { 
        nodeId: id,
        workspaceId: (window as any).__currentWorkspaceId
      } 
    }));
  };

  // Render content with optional highlights and Markdown
  const renderContent = (content: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content || ""}
        </ReactMarkdown>
      );
    }

    // Create a regex to find all highlights
    const sortedHighlights = [...new Set(highlights)].sort((a, b) => b.length - a.length);
    const pattern = sortedHighlights.filter(h => h.length > 0).map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '$&')).join('|');
    if (!pattern) {
        return (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || ""}
            </ReactMarkdown>
        );
    }

    const regex = new RegExp(`(${pattern})`, 'g');
    const parts = content.split(regex);

    // Render parts, applying highlight if it's a matched highlight
    const highlightedContent = parts.map((part, i) => 
        sortedHighlights.includes(part) ? (
            <span key={i} className="bg-[#10b981] text-white px-1 rounded shadow-sm mx-0.5 font-medium">
                {part}
            </span>
        ) : part
    );
    
    // Since ReactMarkdown expects a string, we cannot directly pass React elements. 
    // This is a temporary compromise: if highlights are present, Markdown rendering is simple.
    // A more robust solution would involve a custom ReactMarkdown renderer for text nodes.
    return <div className="whitespace-pre-wrap">{highlightedContent}</div>;
  };

  // Collapsed view shows minimal content
  if (data.collapsed) {
    return (
      <div
        onDoubleClick={handleDoubleClick}
        className={clsx(
          'group relative flex items-center w-[240px] h-[48px] bg-[#2a2a2a] border rounded-xl shadow-lg transition-all duration-300 cursor-default px-3',
          selected 
            ? 'border-[#9c2a2a] ring-2 ring-[#9c2a2a]/20 !bg-[#333333]' 
            : 'border-white/10 hover:border-white/20',
          data.locked && 'nodrag'
        )}
      >
        <Handle type="target" position={Position.Left} id="left" className="!bg-white/30 !w-2 !h-2 !-left-1" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-white/30 !w-2 !h-2 !-right-1" />
        
        <div className="flex-1 truncate text-sm text-zinc-200">{data.summaryQuestion || 'Node'}</div>
        
        {data.locked && (
          <Lock size={12} className="text-amber-400/70 ml-2" />
        )}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={clsx(
        'group relative flex flex-col w-[340px] min-h-[120px] bg-[#2a2a2a] border rounded-2xl shadow-2xl transition-all duration-500 cursor-default',
        selected 
          ? 'border-[#9c2a2a] ring-2 ring-[#9c2a2a]/20 scale-[1.03] z-[1000] !bg-[#333333]' 
          : 'border-white/10 hover:border-white/20',
        data.isNew && 'animate-in zoom-in-95 fade-in duration-700 ring-4 ring-[#9c2a2a]/30',
        data.locked && 'nodrag' // Prevent dragging when locked
      )}
    >
      {/* Lock Badge */}
      {data.locked && (
        <div className="absolute top-2 left-2 p-1.5 bg-amber-500/20 rounded-lg z-20" title="节点已锁定">
          <Lock size={12} className="text-amber-400" />
        </div>
      )}
      
      {/* New Badge */}
      {data.isNew && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-[#9c2a2a] text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-20 animate-pulse">
          New Insight
        </div>
      )}
      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left" 
        className="!bg-white/20 !w-3 !h-3 !-left-1.5 group-hover:!opacity-100 group-hover:hover:!bg-[#9c2a2a] border border-[#111] !transition-all hover:scale-125 !z-[2000] cursor-crosshair opacity-0" 
        style={{ top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" 
        className="!bg-white/20 !w-3 !h-3 !-right-1.5 group-hover:!opacity-100 group-hover:hover:!bg-[#9c2a2a] border border-[#111] !transition-all hover:scale-125 !z-[2000] cursor-crosshair opacity-0" 
        style={{ top: '50%' }}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top" 
        className="!bg-white/20 !w-3 !h-3 !-top-1.5 group-hover:!opacity-100 group-hover:hover:!bg-[#9c2a2a] border border-[#111] !transition-all hover:scale-125 !z-[2000] cursor-crosshair opacity-0" 
        style={{ left: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom" 
        className="!bg-white/20 !w-3 !h-3 !-bottom-1.5 group-hover:!opacity-100 group-hover:hover:!bg-[#9c2a2a] border border-[#111] !transition-all hover:scale-125 !z-[2000] cursor-crosshair opacity-0" 
        style={{ left: '50%' }}
      />

      <div className="p-3 flex flex-col gap-3 relative z-10">
        {/* Question Area */}
        <div className="flex flex-col gap-1 relative pl-3 border-l-4 border-[#9c2a2a]">
          <div className="text-sm font-bold text-zinc-100 leading-snug">
            {data.summaryQuestion || 'Exploring...'}
          </div>
        </div>

        {/* Answer Area */}
        <div className="flex flex-col gap-1 relative pl-3 border-l-4 border-emerald-500/50">
          <div 
              ref={answerRef}
              className="text-[13px] text-zinc-300 leading-relaxed nodrag"
          >
              <div className="prose prose-invert prose-sm max-w-none">
                  {renderContent(data.summaryAnswer || "...", data.highlights)}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with React.memo for performance
export const CustomNode = React.memo(CustomNodeComponent);
