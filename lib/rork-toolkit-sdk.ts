import { useState, useCallback, useRef, useEffect } from 'react';
import OpenAI from 'openai';

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not found. AI features will not work.');
    return null;
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for browser usage
  });
};

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface UseRorkAgentConfig {
  systemPrompt: string;
  tools?: Record<string, any>;
}

export interface UseRorkAgentReturn {
  messages: Message[];
  sendMessage: (message: string) => Promise<void>;
}

export function useRorkAgent(config: UseRorkAgentConfig): UseRorkAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      const openai = getOpenAIClient();
      if (!openai) {
        // Fallback: add a mock response if OpenAI is not configured
        const mockResponse: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: 'OpenAI API key is not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.',
            },
          ],
        };
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() - 1}`,
            role: 'user',
            parts: [{ type: 'text', text: userMessage }],
          },
          mockResponse,
        ]);
        return;
      }

      // Add user message
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        parts: [{ type: 'text', text: userMessage }],
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        // Prepare messages for OpenAI using ref to get current messages
        // Include the user message we just added manually
        const currentMessages = [...messagesRef.current, userMsg];
        const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: config.systemPrompt,
          },
          ...currentMessages
            .filter((msg) => msg.role !== 'system')
            .map((msg) => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.parts[0]?.text || '',
            })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        ];

        // Call OpenAI API
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 500,
        });

        const assistantMessage = response.choices[0]?.message?.content || '';

        // Add assistant response
        const assistantMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          parts: [{ type: 'text', text: assistantMessage }],
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error: any) {
        console.error('Error calling OpenAI API:', error);

        // Add error message
        const errorMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: error?.message || 'Sorry, I encountered an error. Please try again later.',
            },
          ],
        };

        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [config.systemPrompt]
  );

  return {
    messages,
    sendMessage,
  };
}

export function createRorkTool(tool: any): any {
  // Tool creation function - can be extended later
  return tool;
}

