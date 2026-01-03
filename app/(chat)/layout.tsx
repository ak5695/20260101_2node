import Script from "next/script";
import { Suspense } from "react";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { auth } from "@/app/(auth)/auth";
import { getOrCreateUserWorkspace } from "../../lib/actions/canvas";
import { CanvasLayout } from "@/components/canvas/CanvasLayout";

async function LayoutContent({ 
  children, 
  workspaceId 
}: { 
  children: React.ReactNode, 
  workspaceId?: string 
}) {
  const session = await auth();
  
  let activeWorkspaceId = workspaceId;
  
  if (!activeWorkspaceId) {
    const workspace = await getOrCreateUserWorkspace();
    activeWorkspaceId = workspace?.id;
  }

  if (!activeWorkspaceId) {
    return <div className="h-dvh bg-[#1e1e1e] flex items-center justify-center text-zinc-500">Initializing...</div>;
  }

  return (
    <CanvasLayout workspaceId={activeWorkspaceId} user={session?.user}>
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
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
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
