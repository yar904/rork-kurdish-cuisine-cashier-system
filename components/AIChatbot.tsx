import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Send, X, Sparkles, Info, Bell, Users, MessageCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useRorkAgent, createRorkTool } from '@rork/toolkit-sdk';
import { z } from 'zod';
import { Language } from '@/constants/i18n';

interface AIChatbotProps {
  onClose: () => void;
  visible: boolean;
}

export default function AIChatbot({ onClose, visible }: AIChatbotProps) {
  const { t, language } = useLanguage();
  const { addItemToCurrentOrder, selectedTable, currentOrder } = useRestaurant();
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const { messages, sendMessage } = useRorkAgent({
    tools: {
      addToOrder: createRorkTool({
        description: 'Add menu items to the current order',
        zodSchema: z.object({
          itemName: z.string().describe('Name of the menu item to add'),
          quantity: z.number().describe('Quantity of the item'),
          notes: z.string().optional().describe('Special notes or modifications'),
        }),
        execute(input) {
          console.log('Adding item to order:', input);
          addItemToCurrentOrder(input.itemName, input.quantity, input.notes);
          return Promise.resolve('Item added successfully');
        },
      }),
    },
  });

  const getSystemPrompt = (lang: Language): string => {
    const prompts = {
      en: `You are Baran, a friendly AI assistant for Tapse, a Kurdish restaurant. Your role is to help customers:
1. Navigate the platform and understand how to use it
2. Explain how the ordering process works
3. Help them understand the order tracking system
4. Explain how to call for a waiter or request the bill
5. Answer questions about their order status
6. Add items to their order when requested
7. Provide information about the menu and categories

The current table is ${selectedTable}. Always be warm, helpful, and guide customers through their dining experience. When they want to add items, use the addToOrder tool. Keep responses concise but friendly. Respond in English.`,
      ku: `تۆ بارانیت، یاریدەدەری AI ی دۆستانەی چێشتخانەی تاپسە، چێشتخانەیەکی کوردی. ئەرکەکەت یارمەتیدانی میوانانە:
1. ڕێنمایی لە پلاتفۆرمەکە و تێگەیشتن لە چۆنیەتی بەکارهێنانی
2. ڕوونکردنەوەی پرۆسەی داواکردن
3. یارمەتیدان بۆ تێگەیشتن لە سیستەمی شوێنکەوتنی داواکاری
4. ڕوونکردنەوەی چۆنیەتی بانگهێشتنی گارسۆن یان داواکردنی حساب
5. وەڵامدانەوەی پرسیارەکان دەربارەی دۆخی داواکاریەکانیان
6. زیادکردنی بڕگەکان بۆ داواکاریەکانیان کاتێک داوا دەکرێت
7. زانیاری دابینکردن دەربارەی مینیو و جۆرەکان

مێزی ئێستا ${selectedTable}. هەمیشە گەرم و یارمەتیدەر بە و ڕێنمایی میوانەکان بکە لە ئەزموونی خواردنیاندا. کاتێک دەیانەوێت بڕگەکان زیاد بکەن، ئامرازی addToOrder بەکاربهێنە. وەڵامەکان کورت و دۆستانە بهێڵەرەوە. وەڵامەکانت بە کوردی بدەرەوە.`,
      ar: `أنت باران، مساعد الذكاء الاصطناعي الودود لمطعم تابسي، وهو مطعم كردي. دورك هو مساعدة العملاء في:
1. التنقل في المنصة وفهم كيفية استخدامها
2. شرح كيفية عمل عملية الطلب
3. مساعدتهم على فهم نظام تتبع الطلبات
4. شرح كيفية استدعاء النادل أو طلب الفاتورة
5. الإجابة على الأسئلة حول حالة طلباتهم
6. إضافة العناصر إلى طلباتهم عند الطلب
7. توفير معلومات حول القائمة والفئات

الطاولة الحالية هي ${selectedTable}. كن دائماً دافئاً ومفيداً وقم بإرشاد العملاء خلال تجربة تناول الطعام. عندما يريدون إضافة عناصر، استخدم أداة addToOrder. اجعل الردود موجزة وودية. استجب باللغة العربية.`,
    };
    return prompts[lang];
  };

  useEffect(() => {
    if (visible && messages.length === 0) {
      const greetings = {
        en: "Hello! 👋 I'm Baran, your friendly assistant at Tapse Kurdish restaurant. I'm here to help you with ordering, tracking your order, calling a waiter, or answering any questions. How can I help you today?",
        ku: "سڵاو! 👋 من بارانم، یاریدەدەری دۆستانەی تۆم لە چێشتخانەی تاپسە. لێرەم بۆ یارمەتیدانت لە داواکردن، شوێنکەوتنی داواکاری، بانگهێشتنی گارسۆن، یان وەڵامدانەوەی هەر پرسیارێک. چۆن دەتوانم یارمەتیت بدەم ئەمڕۆ؟",
        ar: "مرحباً! 👋 أنا باران، مساعدك الودود في مطعم تابسي الكردي. أنا هنا لمساعدتك في الطلب، أو تتبع طلبك، أو استدعاء النادل، أو الإجابة على أي أسئلة. كيف يمكنني مساعدتك اليوم؟"
      };
      
      sendMessage({
        text: `SYSTEM: ${getSystemPrompt(language)}\n\nUSER_GREETING: ${greetings[language]}`,
        files: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, language]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({ text: input, files: [] });
      setInput('');
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Sparkles size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Baran AI Assistant</Text>
            <Text style={styles.headerSubtitle}>{t('helpNavigateExperience')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => sendMessage({ text: 'How do I order?', files: [] })}>
            <MessageCircle size={16} color={Colors.primary} />
            <Text style={styles.quickActionText}>{t('howToOrder')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => sendMessage({ text: 'How do I track my order?', files: [] })}>
            <Info size={16} color={Colors.primary} />
            <Text style={styles.quickActionText}>{t('trackOrder')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => sendMessage({ text: 'How do I call a waiter?', files: [] })}>
            <Users size={16} color={Colors.primary} />
            <Text style={styles.quickActionText}>{t('callWaiter')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => sendMessage({ text: 'How do I request the bill?', files: [] })}>
            <Bell size={16} color={Colors.primary} />
            <Text style={styles.quickActionText}>{t('requestBill')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((m) => {
          if (m.role === 'system') return null;
          
          return (
            <View key={m.id} style={styles.messageGroup}>
              {m.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    const isFirstMessage = m === messages[0];
                    const displayText = isFirstMessage && m.role === 'user' && part.text.includes('USER_GREETING:') 
                      ? part.text.split('USER_GREETING:')[1]?.trim() || part.text
                      : part.text;
                    
                    if (isFirstMessage && m.role === 'user' && !displayText) return null;
                    
                    return (
                      <View
                        key={`${m.id}-text-${i}`}
                        style={[
                          styles.messageBubble,
                          m.role === 'user' ? styles.userMessage : styles.assistantMessage,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            m.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                          ]}
                        >
                          {displayText}
                        </Text>
                      </View>
                    );
                  case 'tool':
                    switch (part.state) {
                      case 'input-streaming':
                      case 'input-available':
                        return (
                          <View key={`${m.id}-tool-${i}-${part.state}`} style={styles.toolMessage}>
                            <Sparkles size={14} color={Colors.primary} />
                            <Text style={styles.toolText}>Adding {part.toolName}...</Text>
                          </View>
                        );
                      case 'output-available':
                        return (
                          <View key={`${m.id}-tool-${i}-output`} style={styles.toolMessage}>
                            <Sparkles size={14} color={Colors.success} />
                            <Text style={styles.toolText}>Item added to order!</Text>
                          </View>
                        );
                      case 'output-error':
                        return (
                          <View key={`${m.id}-tool-${i}-error`} style={styles.toolErrorMessage}>
                            <Text style={styles.toolErrorText}>Error: {part.errorText}</Text>
                          </View>
                        );
                    }
                    return null;
                  default:
                    return null;
                }
              })}
            </View>
          );
        })}

      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder={t('askBaran')}
          placeholderTextColor={Colors.textLight}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Send size={20} color={input.trim() ? '#fff' : Colors.textLight} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {currentOrder.length > 0 && (
        <View style={styles.orderPreview}>
          <Text style={styles.orderPreviewText}>
            Current order: {currentOrder.length} item{currentOrder.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageGroup: {
    gap: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundGray,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: Colors.text,
  },
  toolMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  toolText: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: 'italic' as const,
  },
  toolErrorMessage: {
    padding: 10,
    backgroundColor: '#fee',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  toolErrorText: {
    fontSize: 13,
    color: '#c00',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.backgroundGray,
  },
  orderPreview: {
    padding: 12,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderPreviewText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
});
