'use client';

import React, { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { FlowCanvas } from './FlowCanvas';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactFlowProvider } from 'reactflow';

import { User } from 'next-auth';

interface CanvasLayoutProps {
    workspaceId: string;
    user: User | undefined;
    children?: React.ReactNode;
}

export function CanvasLayout({ workspaceId: propWorkspaceId, user, children }: CanvasLayoutProps) {
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
              <Sidebar 
                  workspaceId={workspaceId} 
                  user={user} 
                  onPromoteToNode={handlePromoteToNode} 
              />
              <div className="flex-1 relative h-full min-w-0">
                  <FlowCanvas workspaceId={workspaceId} />
                  {children}
              </div>
          </div>
        </SidebarProvider>
      </ReactFlowProvider>
    );
}
