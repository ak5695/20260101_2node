import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { getWorkspacesByUserId } from '@/lib/db/queries';

export default async function HomePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  // 获取用户的所有画布
  const workspaces = await getWorkspacesByUserId(session.user.id);
  
  if (workspaces.length === 0) {
    redirect('/workspaces');
  }
  
  // 直接取第一个（数据库已按 updatedAt 排序）
  redirect(`/workspaces/${workspaces[0].id}`);
}
