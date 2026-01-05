import Script from "next/script";
import { Suspense } from "react";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { auth } from "@/app/(auth)/auth";
import { getOrCreateUserWorkspace } from "../../lib/actions/canvas";
import { getWorkspacesByUserId } from "@/lib/db/queries";
import { CanvasLayout } from "@/components/canvas/CanvasLayout";

async function LayoutContent({ 
  children, 
  workspaceId 
}: { 
  children: React.ReactNode, 
  workspaceId?: string 
}) {
  const session = await auth();
  const workspaces = session?.user?.id 
    ? await getWorkspacesByUserId(session.user.id)
    : [];

  let activeWorkspaceId = workspaceId;
  
  if (!activeWorkspaceId && workspaces.length > 0) {
    activeWorkspaceId = workspaces[0].id;
  } else if (!activeWorkspaceId && session?.user?.id) {
    const workspace = await getOrCreateUserWorkspace(session.user.id);
    activeWorkspaceId = workspace?.id;
  }

  if (!activeWorkspaceId) {
    return (
      <div className="h-dvh bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
             <div className="size-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
          <span className="text-sm font-medium text-zinc-400">正在为您准备空间...</span>
        </div>
      </div>
    );
  }

  return (
    <CanvasLayout 
      workspaceId={activeWorkspaceId} 
      user={session?.user}
      initialWorkspaces={workspaces}
    >
      {children}
    </CanvasLayout>
  );
}

export default async function Layout({ 
  children,
  params
}: { 
  children: React.ReactNode,
  params: Promise<{ workspaceId?: string }>
}) {
  const resolvedParams = await params;
  
  return (
    <>

      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh bg-[#1e1e1e]" />}>
           <LayoutContent workspaceId={resolvedParams.workspaceId}>
              {children}
           </LayoutContent>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}
