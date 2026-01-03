'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { Type, Check, X } from 'lucide-react';

export type TextNodeData = {
  text: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  locked?: boolean;
};

function TextNodeComponent({ id, data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fontSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[data.fontSize || 'md'];

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.locked) {
      setIsEditing(true);
      setEditText(data.text || '');
    }
  }, [data.locked, data.text]);

  const handleSave = useCallback(() => {
    // Dispatch event to update node data
    const event = new CustomEvent('update-text-node', { 
      detail: { id, text: editText } 
    });
    window.dispatchEvent(event);
    setIsEditing(false);
  }, [id, editText]);

  const handleCancel = useCallback(() => {
    setEditText(data.text || '');
    setIsEditing(false);
  }, [data.text]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="bg-[#2a2a2a] border border-[#9c2a2a] rounded-lg p-2 shadow-xl min-w-[200px]">
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[80px] bg-transparent text-white resize-none outline-none nodrag"
          placeholder="输入文本..."
        />
        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/10">
          <button 
            onClick={handleCancel}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          <button 
            onClick={handleSave}
            className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Check size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={clsx(
        'group relative px-3 py-2 rounded-lg transition-all duration-200 cursor-default min-w-[100px]',
        selected 
          ? 'bg-[#2a2a2a]/80 ring-2 ring-[#9c2a2a]/30' 
          : 'bg-transparent hover:bg-[#2a2a2a]/50',
        data.locked && 'nodrag'
      )}
    >
      {/* Connection Handles (subtle) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left" 
        className="!bg-white/10 !w-2 !h-2 !-left-1 !opacity-0 group-hover:!opacity-100 !transition-opacity" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" 
        className="!bg-white/10 !w-2 !h-2 !-right-1 !opacity-0 group-hover:!opacity-100 !transition-opacity" 
      />

      {/* Text Content */}
      <div 
        className={clsx(
          'whitespace-pre-wrap break-words',
          fontSize,
          data.color || 'text-zinc-300'
        )}
        style={{ color: data.color }}
      >
        {data.text || (
          <span className="text-zinc-500 italic">双击编辑</span>
        )}
      </div>

      {/* Type indicator on hover */}
      <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-zinc-500">
        <Type size={10} />
        文本
      </div>
    </div>
  );
}

export const TextNode = React.memo(TextNodeComponent);
