'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  History,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquarePlus,
  Layout as LayoutIcon,
  List,
  Shield,
  FileText,
  CreditCard,
  LogOut,
  ChevronRight,
  ArrowLeft,
  X,
  Menu,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css'; 
import dynamic from 'next/dynamic';

import type { User } from 'next-auth';
import { SidebarHistory } from '@/components/sidebar-history';
import { getThreadMessagesAction, createWorkspaceAction, getChatsAction } from '../../lib/actions/canvas';

import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

// 动态导入重型组件，减少初始加载大小
const Chat = dynamic(() => import('@/components/chat').then(mod => mod.Chat), {
  loading: () => <div className="h-full flex items-center justify-center text-zinc-500">加载中...</div>,
  ssr: false
});

const SidebarWorkspaceHistory = dynamic(
  () => import('@/components/sidebar-workspace-history').then(mod => mod.SidebarWorkspaceHistory),
  {
    loading: () => <div className="h-full flex items-center justify-center text-zinc-500">加载中...</div>,
    ssr: false
  }
);

import { convertToUIMessages } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { VisibilitySelector } from '@/components/visibility-selector';
import { messageCache } from '@/lib/message-cache';
import { useIsMobile } from '@/hooks/use-mobile';


interface SidebarProps {
  workspaceId: string;
  user: User | undefined;
  onPromoteToNode?: (content: string, summary?: { summaryQuestion: string; summaryAnswer: string; }) => Promise<void>;
  initialWorkspaces?: any[];
}

type TabType = 'history' | 'workspaces' | 'settings';

export function Sidebar({ workspaceId, user, onPromoteToNode, initialWorkspaces }: SidebarProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const urlId = params?.id as string | undefined;

  // 从 URL 读取当前激活的 Tab（添加 null 检查）
  const activeTab = (searchParams?.get('tab') as TabType) || 'history';

  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(500); 
  const [isResizing, setIsResizing] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(urlId || null);
  const [chatViewMode, setChatViewMode] = useState<'list' | 'chat'>(urlId ? 'chat' : 'list');

  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatId, setChatId] = useState<string>(() => urlId || crypto.randomUUID());
  const [settings, setSettings] = useState({
    autoPromote: false
  });

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedAutoPromote = localStorage.getItem('canvas-auto-promote');
        if (savedAutoPromote !== null) {
            setSettings(prev => ({ ...prev, autoPromote: JSON.parse(savedAutoPromote) }));
        }
    }
  }, []);

  // Collapse on mobile by default
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Sync activeThreadId with URL param and switch to chat tab
  useEffect(() => {
    setActiveThreadId(urlId || null);
    if (urlId) {
      // activeTab is now derived from URL, no need to set it
      setChatViewMode('chat');
      if (!isMobile) setCollapsed(false);
    }
  }, [urlId, isMobile]);

  // ... (Tab control, load saved width)

  // Initialize/Load messages with global caching for instant loads
  useEffect(() => {
    let active = true;
    
    async function fetchMessages() {
        if (!activeThreadId) {
            setInitialMessages([]);
            setChatId(crypto.randomUUID());
            return;
        }

        // Check global cache first - instant load if available
        const cachedMessages = messageCache.get(activeThreadId);
        if (cachedMessages) {
            setInitialMessages(cachedMessages);
            setChatId(activeThreadId);
            setIsLoadingMessages(false);
            
            // Still fetch in background to get any new messages (stale-while-revalidate)
            getThreadMessagesAction(activeThreadId).then((msgs) => {
                if (active && msgs) {
                    const freshMessages = convertToUIMessages(msgs);
                    messageCache.set(activeThreadId, freshMessages);
                    setInitialMessages(freshMessages);
                }
            }).catch(() => {});
            return;
        }

        // No cache - need to fetch
        setIsLoadingMessages(true);
        try {
            const msgs = await getThreadMessagesAction(activeThreadId);
            if (active && msgs) {
                const converted = convertToUIMessages(msgs);
                // Store in global cache
                messageCache.set(activeThreadId, converted);
                setInitialMessages(converted);
                setChatId(activeThreadId);
            }
        } catch (error) {
            console.error("Failed to load thread messages", error);
        } finally {
            if (active) setIsLoadingMessages(false);
        }
    }
    
    fetchMessages();
    return () => { active = false; };
  }, [activeThreadId]);

  // Handle request-node-detail from canvas (double-click)
  useEffect(() => {
    const handleRequestNodeDetail = () => {
      // activeTab will be set via URL parameter
      setCollapsed(false);
    };
    window.addEventListener('request-node-detail', handleRequestNodeDetail);
    return () => window.removeEventListener('request-node-detail', handleRequestNodeDetail);
  }, []);

  // Try to load last conversation context but don't force a hard redirect
  useEffect(() => {
    if (!urlId && activeTab === 'history') {
      const fetchLastChat = async () => {
        try {
          // 如果列表里已经有数据或正在加载，不要轻易触发
          const result = await getChatsAction();
          const chats = Array.isArray(result) ? result : result.chats;
          
          if (chats && chats.length > 0) {
            const lastChat = chats[0];
            setActiveThreadId(lastChat.id);
            setChatViewMode('chat');
            // 💡 优化：不再使用 router.push 强制跳转，这会触发整个页面的重新渲染
            // 只有当用户显式点击时才进行重定向
          } else {
            setChatViewMode('chat');
          }
        } catch (e) {
          console.error("Failed to fetch last chat", e);
        }
      };
      
      fetchLastChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]); // ✅ 只依赖 urlId，减少重运行次数

  // Handle node deletion from sidebar
  useEffect(() => {
    const handleNodeDeleted = (event: any) => {
      const { nodeId } = event.detail;
      // The canvas itself will likely refresh or handle it if it's listening to database changes
      // but we can proactively trigger a refresh here if needed or just let the nodes list update
      // actually, the FlowCanvas component manages its own nodes state.
    };
    window.addEventListener('node-deleted-from-sidebar', handleNodeDeleted);
    return () => window.removeEventListener('node-deleted-from-sidebar', handleNodeDeleted);
  }, []);

  // Handle Ask AI request from sidebar detail view
  useEffect(() => {
    const handleAskAIRequest = (event: any) => {
      const { query, chatId: targetChatId } = event.detail;
      
      if (targetChatId) {
        // Node has an associated chat - navigate to it with the query
        setActiveThreadId(targetChatId);
        setChatViewMode('chat');
        router.push(`/chat/${targetChatId}?query=${encodeURIComponent(query)}`);
      } else {
        // Node has no chat (created directly from canvas) - create new chat with query
        const newChatId = crypto.randomUUID();
        setActiveThreadId(null);
        setChatId(newChatId);
        setInitialMessages([]);
        setActiveTab('history');
        setChatViewMode('chat');
        
        // Navigate to new chat with query parameter and tab
        router.push(`/?tab=history&query=${encodeURIComponent(query)}`);
      }
    };
    window.addEventListener('request-chat-query', handleAskAIRequest);
    return () => window.removeEventListener('request-chat-query', handleAskAIRequest);
  }, [router]);

  // Tab control - Use URL parameters
  const setActiveTab = (tab: TabType) => {
    if (!pathname) return; // 防止 pathname 为 undefined
    const newUrl = `${pathname}?tab=${tab}`;
    router.push(newUrl, { scroll: false });
    setCollapsed(false);
  };

  // Load saved width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('sidebar-width');
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setSidebarWidth(parsed);
        }
      }
    }
  }, []);

  const handleNewChat = async () => {
     setActiveThreadId(null);
     setInitialMessages([]);
     setChatId(crypto.randomUUID());
     setActiveTab('history');
     setChatViewMode('chat');
     router.push('/?tab=history');
  };

  const handleNewWorkspace = async () => {
    try {
      // Create workspace
      const ws = await createWorkspaceAction();
      
      if (ws) {
        // Notify workspace list to update
        window.dispatchEvent(new CustomEvent('workspace-created', { 
          detail: { workspace: ws } 
        }));
        
        // Navigate to new workspace and set tab
        router.push(`/workspaces/${ws.id}?tab=workspaces`);
        toast.success('新空间已创建');
      }
    } catch (e) {
      toast.error('创建失败');
    }
  };

  const navItems = [
    { id: 'history', icon: History, label: '对话' },
    { id: 'workspaces', icon: LayoutIcon, label: '工作空间' },
    { id: 'settings', icon: Settings, label: '设置' },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    // Dispatch event for other components (like Dock) to know sidebar state
    window.dispatchEvent(new CustomEvent('sidebar-collapsed-change', { 
      detail: { collapsed: !collapsed } 
    }));
  };

  const sidebarContent = (
    <div className={clsx(
      "flex h-full w-full overflow-hidden",
      isMobile ? "flex-col" : "flex-row"
    )}>
      {/* 1. Tab Navigation Bar */}
      <div className={clsx(
        "flex items-center gap-4 shrink-0 border-white/5 bg-[#1e1e1e]",
        isMobile 
          ? "w-full h-[60px] flex-row px-4 border-b" 
          : "w-[50px] flex-col py-4 border-r",
        isMobile && chatViewMode === 'chat' && "hidden"
      )}>
        {!isMobile && (
          <button 
            onClick={toggleSidebar}
            className="p-2 text-[#858585] hover:text-white transition-colors mb-4"
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}

        {isMobile && (
          <div className="flex-1 flex items-center gap-2">
              <div className="size-6 rounded bg-white flex items-center justify-center">
                <span className="text-[10px] font-black text-black">2N</span>
              </div>
              <span className="text-sm font-black tracking-tighter uppercase italic">2node</span>
          </div>
        )}

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              const newTab = item.id as TabType;
              
              if (collapsed && !isMobile) {
                setActiveTab(newTab);
              } else if (!isMobile && activeTab === item.id) {
                setCollapsed(true);
              } else {
                setActiveTab(newTab);
              }
            }}
            className={clsx(
              'p-2 rounded-xl transition-all relative group',
              activeTab === item.id ? 'text-white bg-white/10' : 'text-[#858585] hover:text-[#e0e0e0] hover:bg-white/5'
            )}
            title={item.label}
          >
            <item.icon size={isMobile ? 20 : 22} />
            {!isMobile && collapsed && ( 
                <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                </div>
            )}
          </button>
        ))}

        <div className={clsx(!isMobile && "mt-auto pb-2", "flex items-center gap-3")}>
          {isMobile && (
            <button 
              onClick={() => setCollapsed(true)}
              className="p-2 text-white hover:bg-white/5 rounded-lg ml-2"
              title="返回画布"
            >
              <X size={24} />
            </button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="size-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-lg hover:ring-2 hover:ring-white/20 transition-all outline-none">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isMobile ? "end" : "start"} 
              side={isMobile ? "bottom" : "right"} 
              className="w-56 bg-[#1a1a1a] border-white/10 text-white z-[350]"
            >
              <div className="px-2 py-1.5 pointer-events-none">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer px-2 py-1.5 rounded-md transition-colors">
                <Link href="/privacy" className="flex items-center gap-2 w-full">
                  <Shield size={16} />
                  Privacy Policy
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer px-2 py-1.5 rounded-md transition-colors">
                <Link href="/terms" className="flex items-center gap-2 w-full">
                  <FileText size={16} />
                  Terms of Service
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer px-2 py-1.5 rounded-md transition-colors">
                <Link href="/refund" className="flex items-center gap-2 w-full">
                  <CreditCard size={16} />
                  Refund Policy
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer px-2 py-1.5 rounded-md transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Main Content Area (Sliding Panel) */}
      <div 
        className={clsx(
          "flex-shrink-0 flex flex-col h-full transition-all duration-500 ease-in-out origin-left",
          collapsed 
            ? "opacity-0 invisible -translate-x-8 scale-95" 
            : "opacity-100 visible translate-x-0 scale-100"
        )}
        style={{ 
          width: isMobile ? '100%' : sidebarWidth - 50,
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
        }}
      >
        <div className="flex-1 flex flex-col min-h-0 min-w-[300px] overflow-hidden">
          <div className="p-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button 
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 text-white hover:bg-white/5 rounded-lg border border-white/10 flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span className="text-xs font-bold">返回画布</span>
                </button>
              )}
              <h2 className="text-sm font-bold text-[#e0e0e0] uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">
                {activeTab === 'history' 
                  ? (chatViewMode === 'list' ? '对话历史' : '对话') 
                  : navItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>
            
            {activeTab === 'history' && (
              <div className="flex items-center gap-2">
                 {chatViewMode === 'chat' ? (
                   <>
                        <button 
                        onClick={() => {
                          setChatViewMode('list');
                          router.push('/');
                        }}
                        className="p-1.5 text-[#858585] hover:text-white bg-[#262626] border border-white/5 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                        title="返回会话列表"
                      >
                        <List size={14} />
                        <span>返回会话列表</span>
                      </button>
                      <button 
                        onClick={handleNewChat}
                        className="p-1.5 text-[#858585] hover:text-white bg-[#262626] border border-white/5 rounded-lg transition-colors"
                        title="开启新会话"
                      >
                        <Plus size={16} />
                      </button>
                      <VisibilitySelector 
                        chatId={chatId}
                        selectedVisibilityType="private"
                        className="bg-[#262626] border border-white/5 rounded-lg h-8 flex items-center px-2 text-xs text-[#858585]"
                      />
                   </>
                 ) : (
                   <button 
                     onClick={handleNewChat}
                     className="p-1.5 text-[#858585] hover:text-white bg-[#262626] border border-white/5 rounded-lg transition-colors"
                     title="开启新会话"
                   >
                     <Plus size={16} />
                   </button>
                 )}
              </div>
            )}

            {activeTab === 'workspaces' && (
              <div className="flex items-center gap-2">
                 <button 
                   onClick={handleNewWorkspace}
                   className="p-1.5 text-[#858585] hover:text-white bg-[#262626] border border-white/5 rounded-lg transition-colors"
                   title="创建工作空间"
                 >
                   <Plus size={16} />
                 </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'history' && (
               <div className="h-full w-full overflow-hidden flex flex-col">
                  {chatViewMode === 'chat' ? (
                    <div className="flex-1 overflow-hidden">
                      {isLoadingMessages ? (
                        <div className="h-full flex flex-col animate-pulse">
                          <div className="flex-1 p-4 space-y-4 overflow-hidden">
                            <div className="flex justify-end"><div className="w-2/3 h-12 bg-white/5 rounded-2xl" /></div>
                            <div className="flex justify-start"><div className="w-3/4 h-24 bg-white/5 rounded-2xl" /></div>
                          </div>
                          <div className="p-4 border-t border-white/5"><div className="h-12 bg-white/5 rounded-xl" /></div>
                        </div>
                      ) : (
                        <Chat
                            key={chatId}
                            id={chatId}
                            initialMessages={initialMessages}
                            initialChatModel={DEFAULT_CHAT_MODEL}
                            initialVisibilityType="private"
                            isReadonly={false}
                            autoResume={true}
                            autoPromote={settings.autoPromote}
                            onPromoteToNode={async (content, summary) => {
                                if (onPromoteToNode) await onPromoteToNode(content, summary);
                            }}
                            className="h-full"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      <SidebarHistory user={user} />
                    </div>
                  )}
               </div>
            )}

            {activeTab === 'workspaces' && (
              <div className="flex-1 flex flex-col min-h-0">
                 <SidebarWorkspaceHistory initialWorkspaces={initialWorkspaces} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-6 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-[#858585] uppercase tracking-[0.2em]">Canvas Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[#e0e0e0]">智能洞察自动提取</span>
                      <p className="text-[11px] text-[#858585]">对话完成后自动将 AI 洞察总结并同步至画布节点</p>
                    </div>
                    <button 
                       onClick={() => {
                          const newValue = !settings.autoPromote;
                          setSettings(prev => ({ ...prev, autoPromote: newValue }));
                          localStorage.setItem('canvas-auto-promote', JSON.stringify(newValue));
                       }}
                        className={clsx(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2",
                          settings.autoPromote ? "bg-zinc-100" : "bg-[#333]"
                        )}
                     >
                        <span className={clsx(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          settings.autoPromote ? "translate-x-5" : "translate-x-0"
                        )} />
                     </button>
                  </div>

                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors opacity-50">
                     <div className="flex flex-col gap-1">
                       <span className="text-sm font-medium text-[#e0e0e0]">节点吸附效果</span>
                       <p className="text-[11px] text-[#858585]">开启后节点在移动时会自动对齐网格</p>
                     </div>
                     <button className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-zinc-700">
                        <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-500 shadow ring-0 translate-x-5" />
                     </button>
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-[#858585] uppercase tracking-[0.2em]">Model Profile</h3>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400">
                              <MessageSquare size={16} />
                          </div>
                          <div>
                              <div className="text-xs font-bold text-[#e0e0e0]">DeepSeek V3</div>
                              <div className="text-[10px] text-zinc-500 font-medium italic">Advanced Reasoning Active</div>
                          </div>
                      </div>
                      <p className="text-[11px] text-[#858585] leading-relaxed">
                          当前已启用 DeepSeek V3 专家模型，支持深度逻辑推理与画布知识图谱智能提炼功能。
                      </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-[#858585] uppercase tracking-[0.2em]">Legal & Support</h3>
                  <div className="flex flex-col gap-2">
                      <Link href="/privacy" className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                          <div className="flex items-center gap-3">
                              <Shield size={16} className="text-[#858585] group-hover:text-[#e0e0e0] transition-colors" />
                              <span className="text-xs text-[#e0e0e0]">Privacy Policy</span>
                          </div>
                          <ChevronRight size={14} className="text-[#858585] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link href="/terms" className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                          <div className="flex items-center gap-3">
                              <FileText size={16} className="text-[#858585] group-hover:text-[#e0e0e0] transition-colors" />
                              <span className="text-xs text-[#e0e0e0]">Terms of Service</span>
                          </div>
                          <ChevronRight size={14} className="text-[#858585] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link href="/refund" className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                          <div className="flex items-center gap-3">
                              <CreditCard size={16} className="text-[#858585] group-hover:text-[#e0e0e0] transition-colors" />
                              <span className="text-xs text-[#e0e0e0]">Refund Policy</span>
                          </div>
                          <ChevronRight size={14} className="text-[#858585] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
    {isMobile ? (
      !collapsed && (
        <div className="fixed inset-0 w-screen h-screen z-[300] bg-[#1e1e1e] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top duration-300">
           {sidebarContent}
        </div>
      )
    ) : (
      <ResizableBox
        width={collapsed ? 50 : sidebarWidth}
        height={Infinity}
        minConstraints={[collapsed ? 50 : 300, Infinity]}
        maxConstraints={[collapsed ? 50 : 800, Infinity]}
        axis="x"
        resizeHandles={collapsed ? [] : ['e']}
        onResize={(e, data) => {
          if (!collapsed) setSidebarWidth(data.size.width);
        }}
        onResizeStop={(e, data) => {
          setIsResizing(false);
          if (!collapsed) {
            localStorage.setItem('sidebar-width', data.size.width.toString());
          }
        }}
        handle={<div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/10 transition-colors z-[100]" />}
        className={clsx(
          "relative flex flex-col h-full bg-[#1e1e1e] border-r border-[#333] shrink-0 z-[160]",
          !isResizing && "transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
          width: collapsed ? 50 : sidebarWidth
        }}
      >
        {sidebarContent}
      </ResizableBox>
    )}
    
    {/* Mobile Toggle Button (Top Left on Mobile) */}
    {isMobile && collapsed && (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed left-4 top-4 size-12 bg-[#1e1e1e]/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl z-[140] hover:bg-white/20 transition-all active:scale-90"
      >
        <Menu size={24} />
      </button>
    )}
    </>
  );
}
