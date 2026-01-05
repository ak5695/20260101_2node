"use client";

import { type ComponentProps, memo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// 💡 优化：动态导入重型 Markdown 渲染器，防止阻塞首页加载
const Streamdown = dynamic(() => import("streamdown").then(mod => mod.Streamdown), {
  ssr: false,
  loading: () => <div className="animate-pulse flex space-y-2 py-2"><div className="h-4 bg-white/5 rounded w-full"></div></div>
});

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "p-1 size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        "prose prose-invert prose-xs max-w-none text-zinc-300 leading-relaxed",
        "prose-headings:text-sm prose-headings:mt-4 prose-headings:mb-2",
        "prose-p:my-2 prose-hr:my-3 text-[13px]",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
