'use server';

import { randomUUID } from 'crypto';
import { auth } from '@/app/(auth)/auth';
import { 
  createWorkspace, 
  getWorkspacesByUserId, 
  getCanvasNodes, 
  getCanvasEdges, 
  createCanvasNode, 
  updateCanvasNode, 
  deleteCanvasNode, 
  createCanvasEdge, 
  deleteCanvasEdge, 
  updateWorkspaceSettings,
  updateWorkspaceName,
  deleteCanvasEdgesByNodeId,
  getWorkspace,
  saveChat,
  saveMessages,
  getMessagesByChatId,
  getChatsByUserId
} from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function createWorkspaceAction(name = 'New Thinking Canvas') {
  const session = await auth();
  if (!session?.user?.id) return null;
  const ws = await createWorkspace(session.user.id, name);
  // Don't revalidate here - let client handle optimistic updates
  return ws;
}

export async function getOrCreateUserWorkspace(providedUserId?: string) {
  let userId = providedUserId;

  if (!userId) {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }
    userId = session.user.id;
  }

  const workspaces = await getWorkspacesByUserId(userId as string);
  if (workspaces.length > 0) {
    return workspaces[0];
  }

  // Create default workspace
  const newWorkspace = await createWorkspace(userId as string, 'My Thinking Canvas');
  return newWorkspace;
}

export async function getWorkspaceDataAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user) return null;

  // 使用 Promise.all 并行查询，速度提升 2x
  const [ws, nodes, edges] = await Promise.all([
    getWorkspace(workspaceId),
    getCanvasNodes(workspaceId),
    getCanvasEdges(workspaceId)
  ]);

  if (!ws) return null;

  return { 
    nodes, 
    edges, 
    workspace: ws 
  }; 
}


export async function createNodeAction(data: any) {
  const session = await auth();
  if (!session?.user) return null;
  
  const node = await createCanvasNode(data);
  revalidatePath('/(chat)');
  return node;
}

export async function updateNodeAction(data: any) {
  const session = await auth();
  if (!session?.user) return null;
  
  const { id, ...updateData } = data;
  const node = await updateCanvasNode(id, updateData);
  // revalidatePath('/(chat)');
  return node;
}

export async function deleteNodeAction(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await deleteCanvasEdgesByNodeId(id);
  await deleteCanvasNode(id);
  revalidatePath('/(chat)');
}

export async function createEdgeAction(data: any) {
  const session = await auth();
  if (!session?.user) return null;

  const edge = await createCanvasEdge(data);
  revalidatePath('/(chat)');
  return edge;
}

export async function updateWorkspaceSettingsAction(workspaceId: string, settings: any) {
    const session = await auth();
    if (!session?.user) return;
    
    await updateWorkspaceSettings(workspaceId, settings);
}

export async function updateWorkspaceNameAction(workspaceId: string, name: string) {
    const session = await auth();
    if (!session?.user) return;
    
    await updateWorkspaceName(workspaceId, name);
    revalidatePath('/canvas');
}

export async function getThreadMessagesAction(threadId: string) {
    const session = await auth();
    if (!session?.user) return [];
    return await getMessagesByChatId({ id: threadId });
}

export async function createThreadAction(workspaceId: string, title: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    
    const id = randomUUID();
    await saveChat({ id, userId: session.user.id, title, visibility: 'private' });
    return { id };
}

export async function saveMessageAction(data: any) {
    const session = await auth();
    if (!session?.user) return;
    
    const id = randomUUID();
    await saveMessages({ messages: [{
        id,
        chatId: data.threadId,
        role: data.role,
        parts: [{ type: 'text', text: data.content }],
        attachments: [],
        createdAt: new Date(),
    }] });
}

import { chatHistoryCache } from '../chat-history-cache';

export async function getChatsAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await chatHistoryCache.getHistory(session.user.id, 20, async () => {
    return await getChatsByUserId({ 
        id: session.user.id!,
        limit: 20,
        startingAfter: null,
        endingBefore: null
    });
  });
}
