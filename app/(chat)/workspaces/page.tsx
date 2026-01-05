import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { getWorkspacesByUserId } from '@/lib/db/queries';

export default async function WorkspacesListPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const workspaces = await getWorkspacesByUserId(session.user.id);
  
  if (workspaces.length === 0) {
    // TODO: 显示欢迎页面，引导用户创建第一个画布
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">欢迎来到 2NODE</h1>
          <p className="text-gray-400 mb-8">开始创建您的第一个知识空间</p>
          <a 
            href="/api/workspaces" 
            className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:scale-105 transition-transform inline-block"
          >
            创建空间
          </a>
        </div>
      </div>
    );
  }
  
  // 如果有画布，重定向到第一个
  redirect(`/workspaces/${workspaces[0].id}`);
}
