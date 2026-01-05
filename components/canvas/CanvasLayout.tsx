'use client';

import React, { useCallback, Suspense, memo } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactFlowProvider } from 'reactflow';

import { User } from 'next-auth';

// 动态导入重型组件
const Sidebar = dynamic(() => import('./Sidebar').then(mod => mod.Sidebar), {
    ssr: false,
    loading: () => <div className="w-[50px] h-full bg-[#1e1e1e] border-r border-[#333]" />
});

const FlowCanvas = dynamic(() => import('./FlowCanvas').then(mod => mod.FlowCanvas), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center">
            <div className="animate-pulse text-zinc-500">加载画布...</div>
        </div>
    )
});

interface CanvasLayoutProps {
    workspaceId: string;
    user: User | undefined;
    children?: React.ReactNode;
    initialWorkspaces?: any[];
}

// 使用 memo 防止不必要的重渲染
const MemoizedFlowCanvas = memo(FlowCanvas);

export function CanvasLayout({ workspaceId: propWorkspaceId, user, children, initialWorkspaces }: CanvasLayoutProps) {
    const params = useParams();
    // Prefer URL param over prop (handles dynamic routing)
    const workspaceId = (params.workspaceId as string) || propWorkspaceId;
    
    const handlePromoteToNode = useCallback(async (content: string, summary?: any) => {
        const event = new CustomEvent('add-node', { detail: { message: content, summary } });
        window.dispatchEvent(event);
    }, []);

    return (
      <ReactFlowProvider>
        <SidebarProvider defaultOpen={true} className="flex-1 w-full h-full"> 
          <div className="flex w-full h-screen overflow-hidden bg-[#1e1e1e] text-white">
              <Suspense fallback={<div className="w-[50px] h-full bg-[#1e1e1e] border-r border-[#333]" />}>
                <Sidebar 
                    workspaceId={workspaceId} 
                    user={user} 
                    onPromoteToNode={handlePromoteToNode} 
                    initialWorkspaces={initialWorkspaces}
                />
              </Suspense>
              <div className="flex-1 relative h-full min-w-0">
                  <Suspense fallback={
                    <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center">
                      <div className="animate-pulse text-zinc-500">加载画布...</div>
                    </div>
                  }>
                    <MemoizedFlowCanvas workspaceId={workspaceId} />
                  </Suspense>
                  {children}
              </div>
          </div>
        </SidebarProvider>
      </ReactFlowProvider>
    );
}
