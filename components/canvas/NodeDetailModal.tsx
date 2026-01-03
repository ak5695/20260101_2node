"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, Plus, Highlighter, Copy, Send } from 'lucide-react';

interface NodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: {
    id: string;
    data: {
      fullQuestion: string;
      fullAnswer: string;
      highlights?: string[];
    };
  } | null;
  onUpdateNode: (id: string, fullQuestion: string, fullAnswer: string) => void;
  onGenerateAnswer: (id: string, fullQuestion: string) => void;
  onCreateChildNode: (parentId: string, selectionText: string) => void;
  onMarkText: (id: string, selectionText: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  isOpen,
  onClose,
  node,
  onUpdateNode,
  onGenerateAnswer,
  onCreateChildNode,
  onMarkText
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect | null }>({ text: '', rect: null });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (node) {
      setEditedQuestion(node.data.fullQuestion);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerateAnswer(node.id, editedQuestion);
      setIsEditing(false);
    }
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({ text: sel.toString(), rect });
    } else {
      setSelection({ text: '', rect: null });
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
      <div className="bg-[#1e1e1e] w-full max-w-3xl h-full max-h-[90vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#252526]">
          <h2 className="text-white/50 text-sm font-medium uppercase tracking-wider">节点详情</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Question Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white/40 text-xs font-bold uppercase">Question</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  EDIT
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="relative">
                <textarea
                  autoFocus
                  value={editedQuestion}
                  onChange={(e) => setEditedQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[#2d2d2d] text-white p-4 rounded-lg border border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px] text-lg resize-none"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="text-[10px] text-white/30 italic">Enter to generate</span>
                  <button 
                    onClick={() => {
                      onGenerateAnswer(node.id, editedQuestion);
                      setIsEditing(false);
                    }}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onDoubleClick={() => setIsEditing(true)}
                className="text-xl text-white font-medium leading-relaxed cursor-text selection:bg-blue-500/30"
              >
                {node.data.fullQuestion}
              </div>
            )}
          </section>

          {/* Answer Section */}
          <section className="space-y-4 relative">
            <h3 className="text-white/40 text-xs font-bold uppercase">Answer</h3>
            <div 
              ref={contentRef}
              onMouseUp={handleMouseUp}
              className="prose prose-invert max-w-none text-white/90 leading-loose selection:bg-green-500/30"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const [copied, setCopied] = useState(false);

                    const handleCopy = () => {
                      navigator.clipboard.writeText(String(children));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    };

                    return !inline && match ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                        <button 
                          onClick={handleCopy}
                          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white/70 transition-colors"
                        >
                          {copied ? 'Copied!' : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {node.data.fullAnswer}
              </ReactMarkdown>
            </div>

            {/* Selection Toolbar */}
            {selection.rect && (
              <div 
                className="fixed z-[1001] flex items-center bg-[#2d2d2d] rounded-lg shadow-xl border border-white/10 p-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
                style={{
                  top: selection.rect.top - 45,
                  left: selection.rect.left + (selection.rect.width / 2) - 40
                }}
              >
                <button 
                  onClick={() => {
                    onCreateChildNode(node.id, selection.text);
                    setSelection({ text: "", rect: null });
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-blue-400 flex items-center gap-1.5 px-2"
                  title="创建子节点"
                >
                  <Plus size={16} />
                  <span className="text-[10px] font-bold">NODE</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selection.text);
                    setSelection({ text: "", rect: null });
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 flex items-center gap-1.5 px-2"
                  title="复制文本"
                >
                  <Copy size={16} />
                  <span className="text-[10px] font-bold">COPY</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <button 
                  onClick={() => {
                    onMarkText(node.id, selection.text);
                    setSelection({ text: "", rect: null });
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-green-400 flex items-center gap-1.5 px-2"
                  title="标记文本"
                >
                  <Highlighter size={16} />
                  <span className="text-[10px] font-bold">MARK</span>
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#252526] border-t border-white/10 flex items-center justify-between text-[10px] text-white/30 uppercase tracking-widest font-bold">
          <div>Node ID: {node.id}</div>
          <div className="flex items-center gap-4">
            <span>Markdown Enabled</span>
            <span>Selection Tracking Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
