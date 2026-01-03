"use client";

import { useState } from "react";
import { MessageSquare, History, Settings, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Resizable } from "re-resizable";
import { SidebarHistory } from "./sidebar-history";
import type { User } from "next-auth";
import { ChatInterface } from "./canvas/ChatInterface";

export function NewSidebar({ user }: { user: User | undefined }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: "chat", icon: MessageSquare, label: "对话" },
    { id: "history", icon: History, label: "历史" },
    { id: "settings", icon: Settings, label: "设置" },
  ];

  return (
    <Resizable
      defaultSize={{
        width: isCollapsed ? 60 : 260,
        height: "100%",
      }}
      minWidth={isCollapsed ? 60 : 200}
      maxWidth={600}
      enable={{ right: !isCollapsed }}
      className="flex h-screen bg-[#252526] border-r border-white/10"
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex p-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center p-2 rounded-md transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
                >
                    <tab.icon size={20} />
                    {!isCollapsed && <span className="ml-2 text-sm">{tab.label}</span>}
                </button>
            ))}
        </div>
        <div className="flex-1 overflow-y-auto">
            {activeTab === 'chat' && (
                <ChatInterface onPromoteToNode={(message) => {
                    const event = new CustomEvent('add-node', { detail: { message } });
                    window.dispatchEvent(event);
                }} />
            )}
            {activeTab === 'history' && <SidebarHistory user={user} />}
            {activeTab === 'settings' && <div>Settings</div>}
        </div>
        <div className="p-2 border-t border-white/10">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center p-2 rounded-md text-white/50 hover:bg-white/5"
            >
                {isCollapsed ? <ChevronsRight size={20}/> : <ChevronsLeft size={20} />}
            </button>
        </div>
      </div>
    </Resizable>
  );
}
