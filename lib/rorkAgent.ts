import { useCallback, useState } from 'react';

import { MENU_ITEMS } from '@/constants/menu';
import { formatPrice } from '@/constants/currency';
import type { MenuItem } from '@/types/restaurant';

type AgentRole = 'user' | 'assistant';

type MessagePart = {
  type: 'text';
  text: string;
};

export interface AgentMessage {
  id: string;
  role: AgentRole;
  parts: MessagePart[];
}

type Language = 'en' | 'ku' | 'ar';
type Intent =
  | 'greeting'
  | 'order'
  | 'recommend'
  | 'waiter'
  | 'status'
  | 'thanks'
  | 'fallback';

interface UseRorkAgentConfig {
  systemPrompt?: string;
  tools?: Record<string, unknown>;
}

const HIGHLIGHT_CATEGORIES = new Set(['kebabs', 'rice-dishes', 'desserts']);
const HIGHLIGHT_ITEMS: MenuItem[] = MENU_ITEMS.filter((item) =>
  HIGHLIGHT_CATEGORIES.has(item.category)
).slice(0, 4);

const createMessage = (role: AgentRole, text: string): AgentMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  parts: [{ type: 'text', text }],
});

const extractTableNumber = (systemPrompt?: string): number | null => {
  if (!systemPrompt) return null;
  const match = systemPrompt.match(/current table is\s*(\d+)/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const detectLanguage = (text: string): Language => {
  const containsSorani = /[ێۆەڕڵڤچپگ١٢٣٤٥٦٧٨٩٠]/.test(text);
  if (containsSorani) {
    return 'ku';
  }

  const containsArabicScript = /[\u0600-\u06FF]/.test(text);
  if (containsArabicScript) {
    return 'ar';
  }

  return 'en';
};

const KEYWORDS: Record<Intent, RegExp[]> = {
  greeting: [
    /\bhello\b/i,
    /\bhi\b/i,
    /slaw/i,
    /سلاو/,
    /مرحبا/,
    /اهلا/,
  ],
  order: [
    /\border\b/i,
    /bring/i,
    /need/i,
    /داوا/,
    /خواردن/,
    /دابنێ/,
    /طلب/,
    /اطلب/,
  ],
  recommend: [
    /recommend/i,
    /suggest/i,
    /special/i,
    /پێشنیاز/,
    /پیشنیا/,
    /پیشنیاز/,
    /اقترح/,
    /تنصح/,
  ],
  waiter: [
    /waiter/i,
    /staff/i,
    /help/i,
    /assist/i,
    /گارسۆن/,
    /یارمەتی/,
    /خزمەت/,
    /نادل/,
    /مساعدة/,
    /خدمة/,
  ],
  status: [
    /status/i,
    /ready/i,
    /late/i,
    /where/i,
    /served/i,
    /کەی/,
    /ئامادە/,
    /ڕێکەوت/,
    /حال/,
    /وصل/,
    /تأخرت/,
  ],
  thanks: [
    /thank/i,
    /appreciate/i,
    /سپاس/,
    /سوپاس/,
    /شکرا/,
    /ممتن/,
  ],
  fallback: [],
};

const RESPONSE_TEMPLATES: Record<Language, Record<Intent, string>> = {
  en: {
    greeting: 'Welcome back! How can I help at {table} today?',
    order: 'Absolutely! I will queue that order for {table}.',
    recommend: "I'd love to recommend a few favorites for {table}.",
    waiter: 'No problem — I will let the service team know {table} needs assistance.',
    status: 'Let me check on the dishes for {table} and make sure they are moving along.',
    thanks: 'My pleasure! If anything else comes up at {table}, just let me know.',
    fallback: 'I can help with menu questions, orders, or calling a waiter for {table}.',
  },
  ku: {
    greeting: 'بەخێربێیت! چۆن دەتوانم یارمەتیت بدەم لە {table}؟',
    order: 'بە خۆشی ئەم داواکارییە تۆمار دەکەم بۆ {table}.',
    recommend: 'حازرم ھەندێك خۆشەویست بۆ {table} پێشنیار بکەم.',
    waiter: 'هەستاوە! هاوکارانی خزمەتگوزاری ئاگادار دەکەم {table} پێویستیان بە یارمەتی هەیە.',
    status: 'دەستم دەکەوێت لە چێشتخانە بپرسم بۆ {table} بزانم تا چەند پێشکەوتووە.',
    thanks: 'سەپاس بۆت! هەر پێویستت بوو لە {table}، پێم بڵێ.',
    fallback: 'دەتوانم لەسەر مێنیو، داواکاری، یان بانگهێشتنی گارسۆن بۆ {table} یارمەتیت بدەم.',
  },
  ar: {
    greeting: 'أهلاً بك! كيف أستطيع مساعدتك على {table} اليوم؟',
    order: 'بكل سرور سأجهز هذا الطلب لـ {table}.',
    recommend: 'يسعدني أن أقترح بعض الأطباق المفضلة لـ {table}.',
    waiter: 'تم! سأبلغ طاقم الخدمة أن {table} بحاجة للمساعدة.',
    status: 'سأتأكد من حالة الأطباق الخاصة بـ {table} وأوافيك بالتفاصيل.',
    thanks: 'على الرحب والسعة! إذا احتجت أي شيء آخر على {table} فأخبرني.',
    fallback: 'يمكنني مساعدتك في الأسئلة حول القائمة أو الطلبات أو استدعاء النادل لـ {table}.',
  },
};

const ORDER_CONFIRMATION: Record<Language, string> = {
  en: 'Here is what I noted for the kitchen: "{request}". I will confirm once it is queued.',
  ku: 'ئەم داواکارییە بۆ چێشتخانە تۆمار کرا: "{request}". بەرەوە دەبڕم کە لە چەندە پێشکەوتووە.',
  ar: 'سجلت طلبك للمطبخ: "{request}". سأؤكد لك حالما يتم إدخاله في الطابور.',
};

const STATUS_DETAILS: Record<Language, string> = {
  en: 'Right now most dishes are leaving the kitchen in about 8–10 minutes. I will keep an eye on it for you.',
  ku: 'ئێستا زۆربەی خواردنەکان لە نێوان ٨ تا ١٠ خولەکدا دێنە دەرەوە. چاوم لەسەرە بۆت.',
  ar: 'حالياً تغادر معظم الأطباق المطبخ خلال ٨ إلى ١٠ دقائق. سأتابع ذلك من أجلك.',
};

const WAITER_DETAILS: Record<Language, string> = {
  en: 'I have pinged the floor team so someone will head to you shortly.',
  ku: 'پەیامی هەڵسکێنرا بۆ تیمی خزمەتگوزاری تا کەسێك خێرا بێتە سەرت.',
  ar: 'أرسلت تنبيهاً لطواقم الخدمة ليأتي أحدهم إليك خلال لحظات.',
};

const FALLBACK_DETAILS: Record<Language, string> = {
  en: 'Feel free to speak Kurdish, Arabic, or English — I understand them all.',
  ku: 'دەتوانیت بە کوردی، عەرەبی یان ئینگلیزی قسە بکەیت، هەمووی تێدەگەم.',
  ar: 'يسعدني التحدث معك بالكردية أو العربية أو الإنجليزية، أفهمها جميعاً.',
};

const formatTableLabel = (language: Language, tableNumber: number | null): string => {
  if (tableNumber == null) {
    return language === 'en'
      ? 'your table'
      : language === 'ku'
        ? 'مێزەکەت'
        : 'طاولتك';
  }

  if (language === 'en') return `table ${tableNumber}`;
  if (language === 'ku') return `مێز ${tableNumber}`;
  return `الطاولة ${tableNumber}`;
};

const detectIntent = (text: string): Intent => {
  const normalized = text.toLowerCase();
  for (const intent of ['greeting', 'order', 'recommend', 'waiter', 'status', 'thanks'] as Intent[]) {
    if (KEYWORDS[intent].some((pattern) => pattern.test(normalized) || pattern.test(text))) {
      return intent;
    }
  }
  return 'fallback';
};

const getLocalizedName = (item: MenuItem, language: Language): string => {
  if (language === 'ku') return item.nameKurdish || item.name;
  if (language === 'ar') return item.nameArabic || item.name;
  return item.name;
};

const formatRecommendations = (language: Language): string => {
  if (HIGHLIGHT_ITEMS.length === 0) return '';

  const heading =
    language === 'en'
      ? 'Guest favorites right now:'
      : language === 'ku'
        ? 'خواردنی دڵخواز لەم کاتەدا:'
        : 'الأطباق الأكثر طلباً حالياً:';

  const lines = HIGHLIGHT_ITEMS.map((item) => `• ${getLocalizedName(item, language)} – ${formatPrice(item.price)}`);
  return `${heading}\n${lines.join('\n')}`;
};

const buildAssistantResponse = (
  userText: string,
  _conversation: AgentMessage[],
  systemPrompt?: string,
): string => {
  const language = detectLanguage(userText);
  const intent = detectIntent(userText);
  const tableNumber = extractTableNumber(systemPrompt);
  const tableLabel = formatTableLabel(language, tableNumber);

  const template = RESPONSE_TEMPLATES[language][intent] ?? RESPONSE_TEMPLATES.en[intent];
  let response = template.replace('{table}', tableLabel);

  if (intent === 'order') {
    response += `\n\n${ORDER_CONFIRMATION[language].replace('{request}', userText.trim())}`;
  } else if (intent === 'status') {
    response += `\n\n${STATUS_DETAILS[language]}`;
  } else if (intent === 'waiter') {
    response += `\n\n${WAITER_DETAILS[language]}`;
  } else if (intent === 'recommend') {
    const recommendationText = formatRecommendations(language);
    if (recommendationText) {
      response += `\n\n${recommendationText}`;
    }
  } else if (intent === 'fallback') {
    response += `\n\n${FALLBACK_DETAILS[language]}`;
  }

  return response;
};

export const useRorkAgent = ({ systemPrompt }: UseRorkAgentConfig) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  const sendMessage = useCallback(
    (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed) return;

      setMessages((prev) => {
        const userMessage = createMessage('user', trimmed);
        const conversation = [...prev, userMessage];
        const assistantReply = buildAssistantResponse(trimmed, conversation, systemPrompt);
        const assistantMessage = createMessage('assistant', assistantReply);
        return [...conversation, assistantMessage];
      });
    },
    [systemPrompt],
  );

  const appendAssistantMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, createMessage('assistant', trimmed)]);
  }, []);

  return { messages, sendMessage, appendAssistantMessage } as const;
};

