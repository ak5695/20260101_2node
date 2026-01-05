'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, Maximize, Download, Image, FileCode, Undo2, Redo2, Type, ChevronUp, ChevronDown, Wand2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useIsMobile } from '@/hooks/use-mobile';

const vibrate = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

interface DockProps {
  onAddNode: () => void;
  onAddText: () => void;
  onTidyUp: () => void;
  onZoomToFit: () => void;
  zoomLevel: number;
  onZoomChange: (value: number) => void;
  onExport?: (format: 'png' | 'svg') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function Dock({ onAddNode, onAddText, onTidyUp, onZoomToFit, zoomLevel, onZoomChange, onExport, onUndo, onRedo, canUndo, canRedo }: DockProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleSidebarChange = (e: any) => {
        setSidebarCollapsed(e.detail.collapsed);
    };
    window.addEventListener('sidebar-collapsed-change', handleSidebarChange as EventListener);
    return () => window.removeEventListener('sidebar-collapsed-change', handleSidebarChange as EventListener);
  }, []);

  // On mobile, if sidebar is not collapsed (meaning it's open), we hide the Dock
  const isVisible = !(isMobile && !sidebarCollapsed);

  if (!isVisible) return null;

  // We want to use mobile layout if screen is below 'lg' (1024px)
  const useMobileLayout = isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024);

  return (
    <div className={clsx(
      "fixed z-[100] backdrop-blur-xl border transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]",
      "bottom-60 right-4 flex flex-col-reverse items-center w-12", // Mobile/Tablet: Centered stack above menu button
      "lg:absolute lg:top-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:flex-row lg:px-5 lg:gap-0 lg:h-12 lg:bottom-auto lg:translate-y-0 lg:bg-[#1e1e1e]/95 lg:w-auto", // Desktop: Center-top
      useMobileLayout 
        ? (isExpanded ? "p-2 rounded-2xl bg-[#1e1e1e]/50 border-white/10" : "p-0 rounded-2xl bg-white/50 border-white/20") 
        : "p-2 rounded-2xl"
    )}>
      {/* Mobile Toggle Button */}
      {useMobileLayout && (
        <button
          onClick={() => {
            vibrate();
            setIsExpanded(!isExpanded);
          }}
          className={clsx(
            "size-12 rounded-2xl transition-all duration-300 flex items-center justify-center",
            isExpanded ? "text-white rotate-180" : "text-black"
          )}
        >
          {isExpanded ? <ChevronDown size={24} /> : <Plus size={24} />}
        </button>
      )}

      {/* Tools Container */}
      <div className={clsx(
        "transition-all duration-500 overflow-hidden flex",
        useMobileLayout 
          ? (isExpanded ? "flex-col-reverse opacity-100 max-h-[500px] gap-2 mb-2" : "hidden opacity-0 max-h-0") 
          : "flex-row opacity-100 max-h-none items-center"
      )}>
        <button
          onClick={() => { vibrate(); onAddNode(); }}
          className="group relative p-2 rounded-lg text-[#e0e0e0] hover:bg-white/10 transition-all"
        >
          <Plus size={20} />
          <span className={clsx(
            "absolute px-2 py-1 bg-black text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
            "right-full mr-3 top-1/2 -translate-y-1/2",
            "sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-full sm:mt-3"
          )}>
            添加节点
          </span>
        </button>

        <button
          onClick={() => { vibrate(); onAddText(); }}
          className="group relative p-2 rounded-lg text-[#e0e0e0] hover:bg-white/10 transition-all"
        >
          <Type size={20} />
          <span className={clsx(
            "absolute px-2 py-1 bg-black text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
            "right-full mr-3 top-1/2 -translate-y-1/2",
            "sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-full sm:mt-3"
          )}>
            添加文本
          </span>
        </button>

        <div className="bg-white/10 mx-1 w-6 h-px my-1 sm:w-px sm:h-6 sm:my-0 sm:mx-1" />

        {/* Undo/Redo */}
        <div className="flex flex-col sm:flex-row items-center gap-1">
          <button
            onClick={() => { vibrate(); onUndo?.(); }}
            disabled={!canUndo}
            className={clsx(
              "group relative p-2 rounded-lg transition-all",
              canUndo ? "text-[#e0e0e0] hover:bg-white/10" : "text-zinc-600 cursor-not-allowed"
            )}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={() => { vibrate(); onRedo?.(); }}
            disabled={!canRedo}
            className={clsx(
              "group relative p-2 rounded-lg transition-all",
              canRedo ? "text-[#e0e0e0] hover:bg-white/10" : "text-zinc-600 cursor-not-allowed"
            )}
          >
            <Redo2 size={18} />
          </button>
        </div>

        <div className="bg-white/10 mx-1 w-6 h-px my-1 sm:w-px sm:h-6 sm:my-0 sm:mx-1" />

        <button
          onClick={() => { vibrate(); onTidyUp(); }}
          className="group relative p-2 rounded-lg text-[#e0e0e0] hover:bg-white/10 transition-all"
        >
          <LayoutDashboard size={20} />
        </button>

        <button
          onClick={() => { vibrate(); onZoomToFit(); }}
          className="group relative p-2 rounded-lg text-[#e0e0e0] hover:bg-white/10 transition-all"
        >
          <Maximize size={20} />
        </button>

        <div className="bg-white/10 mx-1 w-6 h-px my-1 sm:w-px sm:h-6 sm:my-0 sm:mx-1" />

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => { vibrate(); setShowExportMenu(!showExportMenu); }}
            className="group relative p-2 rounded-lg text-[#e0e0e0] hover:bg-white/10 transition-all"
          >
            <Download size={20} />
          </button>
          
          {showExportMenu && (
            <div className={clsx(
              "absolute bg-[#1e1e1e] border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[120px] z-[120]",
              "right-full mr-2 top-0",
              "sm:top-full sm:left-1/2 sm:-translate-x-1/2 sm:mt-2 sm:right-auto"
            )}>
              <button
                onClick={() => { onExport?.('png'); setShowExportMenu(false); }}
                className="w-full px-3 py-2 text-left text-xs text-[#e0e0e0] hover:bg-white/10 flex items-center gap-2"
              >
                <Image size={14} /> PNG 图片
              </button>
              <button
                onClick={() => { onExport?.('svg'); setShowExportMenu(false); }}
                className="w-full px-3 py-2 text-left text-xs text-[#e0e0e0] hover:bg-white/10 flex items-center gap-2"
              >
                <FileCode size={14} /> SVG 矢量
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/10 mx-1 w-6 h-px my-1 sm:w-px sm:h-6 sm:my-0 sm:mx-1" />

        {/* Zoom Control */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-[#e0e0e0] text-[12px] font-medium px-1">
          <span className="w-8 text-center tabular-nums sm:order-first order-last">{Math.round(zoomLevel * 100)}%</span>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className={clsx(
              "cursor-pointer accent-white bg-[#444] rounded-sm appearance-none transition-all",
              "w-1 h-20 [appearance:slider-vertical]",
              "sm:w-[80px] sm:h-1 sm:[appearance:auto]"
            )}
            style={{ 
               // @ts-ignore
              WebkitAppearance: typeof window !== 'undefined' && window.innerWidth < 640 ? 'slider-vertical' : 'auto'
            }}
          />
        </div>
      </div>
    </div>
  );
}
