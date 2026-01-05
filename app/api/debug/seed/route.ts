import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '../../../(auth)/auth';
import { db } from '../../../../lib/db/queries';
import { chat, message, workspace, canvasNode, canvasEdge, vote, stream } from '../../../../lib/db/schema';

export const maxDuration = 300; // 5 minutes for massive seeding

const uuidv4 = () => crypto.randomUUID();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  console.log(`[SEED] Starting TOTAL RESET and MASSIVE seed for user: ${userId}`);

  try {
    // 0. 彻底清理该用户的所有旧数据
    console.log("[SEED] Step 0: Cleaning up all existing data...");
    
    // 获取用户所有的工作空间 ID
    const userWorkspaces = await db.select({ id: workspace.id }).from(workspace).where(eq(workspace.userId, userId));
    const wsIds = userWorkspaces.map(w => w.id);
    
    // 获取用户所有的对话 ID
    const userChats = await db.select({ id: chat.id }).from(chat).where(eq(chat.userId, userId));
    const chatIds = userChats.map(c => c.id);

    if (wsIds.length > 0) {
        await db.delete(canvasEdge).where(inArray(canvasEdge.workspaceId, wsIds));
        await db.delete(canvasNode).where(inArray(canvasNode.workspaceId, wsIds));
        await db.delete(workspace).where(inArray(workspace.id, wsIds));
    }
    
    if (chatIds.length > 0) {
        await db.delete(vote).where(inArray(vote.chatId, chatIds));
        await db.delete(stream).where(inArray(stream.chatId, chatIds));
        await db.delete(message).where(inArray(message.chatId, chatIds));
        await db.delete(chat).where(inArray(chat.id, chatIds));
    }

    console.log("[SEED] Cleanup complete. Starting fresh generation...");

    // 1. 生成 200 条独立对话，每条 40 轮来回 (80 条消息)
    console.log("[SEED] Step 1: Generating 200 detailed chats (16,000 messages)...");
    const allGeneratedChatIds: string[] = [];
    
    for (let c = 0; c < 200; c++) {
      const chatId = uuidv4();
      const topic = `深度探讨 AI 系统架构 - 专题 ${c + 1}`;
      
      await db.insert(chat).values({
        id: chatId,
        userId: userId,
        createdAt: new Date(Date.now() - c * 600000),
        title: topic,
      });
      allGeneratedChatIds.push(chatId);

      const messagesToInsert = [];
      for (let m = 0; m < 80; m++) {
        messagesToInsert.push({
          id: uuidv4(),
          chatId: chatId,
          role: m % 2 === 0 ? 'user' : 'assistant',
          parts: [{ 
            type: 'text', 
            text: m % 2 === 0 
              ? `问题 ${Math.floor(m/2) + 1}: 关于 ${topic} 的技术细节。` 
              : `回答 ${Math.floor(m/2) + 1}: 这是一个非常深入的技术回答，讨论了大规模分布式训练中的瓶颈问题以及如何通过优化 MLA 架构来提升吞吐量。`.repeat(5)
          }],
          attachments: [],
          createdAt: new Date(Date.now() - (80 - m) * 10000),
        });
      }
      // 分批插入防止内存溢出
      await db.insert(message).values(messagesToInsert);
      if (c % 20 === 0) console.log(`  - Created ${c} chats...`);
    }

    // 2. 生成 70 个工作空间，每个 20-30 个节点
    console.log("[SEED] Step 2: Generating 70 workspaces with 20-30 nodes each...");
    for (let w = 0; w < 70; w++) {
      const workspaceId = uuidv4();
      const wsName = `全球 AI 智库看板 - 区域 ${String.fromCharCode(65 + (w % 26))}${Math.floor(w / 26)}`;
      
      await db.insert(workspace).values({
        id: workspaceId,
        userId: userId,
        name: wsName,
        createdAt: new Date(Date.now() - w * 3600000),
      });

      const nodeCount = 20 + Math.floor(Math.random() * 11); // 20-30 个节点
      const nodesToInsert = [];
      
      for (let n = 0; n < nodeCount; n++) {
        // 随机关联之前的 200 条对话中的一条
        const randomChatId = allGeneratedChatIds[Math.floor(Math.random() * allGeneratedChatIds.length)];
        
        nodesToInsert.push({
          id: uuidv4(),
          workspaceId,
          chatId: randomChatId,
          type: 'chatNode',
          positionX: (n % 6) * 450 + (Math.random() * 100),
          positionY: Math.floor(n / 6) * 400 + (Math.random() * 100),
          summaryQuestion: `核心议题 ${n + 1}: 模型演进`,
          summaryAnswer: `在该环节中，我们重点讨论了模型在 ${n} 阶段的性能表现。`,
          fullQuestion: `详细调查：模型 ${n} 在极大规模集群下的收敛稳定性。`,
          fullAnswer: `根据第 ${n} 次实验结果，我们发现... (此处省略长篇技术论证)`.repeat(5),
          highlights: JSON.stringify(['AI 系统', '架构', '稳定性']),
        });
      }
      await db.insert(canvasNode).values(nodesToInsert);
      if (w % 10 === 0) console.log(`  - Created ${w} workspaces...`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "SUCCESS: Total reset complete. Generated 200 chats (16k msgs) and 70 massive workspaces (~1750 nodes)!" 
    });
  } catch (error: any) {
    console.log("[SEED] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
