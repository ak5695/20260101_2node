import type {
  AssistantModelMessage,
  ToolModelMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = ToolModelMessage | AssistantModelMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.split('__JSON_SUMMARY__')[0].replace('<has_function_call>', '').trim();
}

/**
 * Extracts and parses the JSON summary from a message if present.
 */
export function extractJSONSummary(text: string): { summaryQuestion: string; summaryAnswer: string } | null {
  const parts = text.split('__JSON_SUMMARY__');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(sanitizeResponseJSON(parts[1]));
  } catch (e) {
    return null;
  }
}

export function sanitizeResponseJSON(text: string): string {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return text.substring(startIndex, endIndex + 1);
  }
  return text.trim();
}

/**
 * Strips common AI polite fillers and introductory phrases to keep text concise.
 */
export function stripPoliteFiller(text: string): string {
  const fillers = [
    /^您提出了一个很好的.*?[问题|建议][。|！|？|：]\s*/,
    /^这是一个(非常棒的|很好的|精彩的|不错的|有趣)的问题[。|！|？|：]\s*/,
    /^关于您提到的.*?，?\s*/,
    /^很高兴为您解答[。|！|？|：]\s*/,
    /^总结如下[：|。]\s*/,
    /^下面是关于.*?的总结[：|。]\s*/,
    /^[好的|没问题|当然可以|收到了|好的][。|！|，]\s*/,
    /^我[来为给]+您?(详细|简单)?(解答|解读|介绍|分析|总结).*?[：|。]\s*/,
    /^(现在)?让(我|我们)(来)?(为您|给你)?(详细|简单)?(解答|解读|介绍|分析|总结).*?[：|。]\s*/,
    /^(好的|没问题)，?(根据您的要求|针对您的问题)?，?\s*/,
    /^好的[，|。]\s*/,
    /^那么[，|。]\s*/,
    /^(综上所述|总的来说|总而言之)[，|。]\s*/,
  ];

  let result = text.trim();
  for (const filler of fillers) {
    result = result.replace(filler, '');
  }
  
  // Also strip common leading phrases that are just noise
  result = result.replace(/^让我们(来)?(一起)?(看看|分析).*?[：|。]\s*/, '');
  
  return result;
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}
