'use client';

import React, { DragEvent } from 'react';
import { MessageSquare, Lightbulb, HelpCircle, FileText, Type } from 'lucide-react';

interface NodeTemplate {
  nodeType: string;  // 'chatNode' or 'textNode'
  type: string;
  label: string;
  icon: React.ReactNode;
  defaultData: any;
}

const templates: NodeTemplate[] = [
  {
    nodeType: 'chatNode',
    type: 'question',
    label: '问题',
    icon: <HelpCircle size={16} />,
    defaultData: {
      summaryQuestion: '新问题',
      summaryAnswer: '等待输入...',
    },
  },
  {
    nodeType: 'chatNode',
    type: 'insight',
    label: '洞察',
    icon: <Lightbulb size={16} />,
    defaultData: {
      summaryQuestion: '新洞察',
      summaryAnswer: '记录你的发现...',
    },
  },
  {
    nodeType: 'chatNode',
    type: 'note',
    label: '笔记',
    icon: <FileText size={16} />,
    defaultData: {
      summaryQuestion: '笔记',
      summaryAnswer: '添加你的笔记...',
    },
  },
  {
    nodeType: 'chatNode',
    type: 'chat',
    label: '对话',
    icon: <MessageSquare size={16} />,
    defaultData: {
      summaryQuestion: '与 AI 对话',
      summaryAnswer: '开始对话...',
    },
  },
  {
    nodeType: 'textNode',
    type: 'text',
    label: '文本',
    icon: <Type size={16} />,
    defaultData: {
      text: '',
      fontSize: 'md',
    },
  },
];

interface NodeTemplatePanelProps {
  onDragStart?: (template: NodeTemplate) => void;
}

export function NodeTemplatePanel({ onDragStart }: NodeTemplatePanelProps) {
  const handleDragStart = (e: DragEvent, template: NodeTemplate) => {
    const dragData = {
      type: template.nodeType,
      data: template.nodeType === 'chatNode' 
        ? {
            ...template.defaultData,
            fullQuestion: template.defaultData.summaryQuestion,
            fullAnswer: '',
            highlights: [],
          }
        : template.defaultData,
    };
    
    e.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(template);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-[#282828]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2 flex gap-2 shadow-2xl">
      {templates.map((template) => (
        <button
          key={template.type}
          draggable
          onDragStart={(e) => handleDragStart(e, template)}
          className="flex flex-col items-center gap-1 p-2 px-4 rounded-xl hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors group"
          title={`拖拽添加${template.label}节点`}
        >
          <div className="text-zinc-400 group-hover:text-white transition-colors">
            {template.icon}
          </div>
          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
            {template.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export { templates };
export type { NodeTemplate };
