import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Send, X, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useRorkAgent, createRorkTool } from '@rork/toolkit-sdk';
import { z } from 'zod';

interface AIChatbotProps {
  onClose: () => void;
  visible: boolean;
}

export default function AIChatbot({ onClose, visible }: AIChatbotProps) {
  const { t } = useLanguage();
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

  useEffect(() => {
    if (visible && messages.length === 0) {
      sendMessage({
        text: `You are an AI assistant for a Kurdish restaurant called Tapse. Help customers place orders. The current table is ${selectedTable}. Be friendly and helpful. When customers tell you what they want, use the addToOrder tool to add items.`,
        files: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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
            <Text style={styles.headerTitle}>AI Order Assistant</Text>
            <Text style={styles.headerSubtitle}>Table {selectedTable}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((m) => (
          <View key={m.id} style={styles.messageGroup}>
            {m.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  if (m.role === 'system') return null;
                  return (
                    <View
                      key={`${m.id}-${i}`}
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
                        {part.text}
                      </Text>
                    </View>
                  );
                case 'tool':
                  switch (part.state) {
                    case 'input-streaming':
                    case 'input-available':
                      return (
                        <View key={`${m.id}-${i}`} style={styles.toolMessage}>
                          <Sparkles size={14} color={Colors.primary} />
                          <Text style={styles.toolText}>Adding {part.toolName}...</Text>
                        </View>
                      );
                    case 'output-available':
                      return (
                        <View key={`${m.id}-${i}`} style={styles.toolMessage}>
                          <Sparkles size={14} color={Colors.success} />
                          <Text style={styles.toolText}>Item added to order!</Text>
                        </View>
                      );
                    case 'output-error':
                      return (
                        <View key={`${m.id}-${i}`} style={styles.toolErrorMessage}>
                          <Text style={styles.toolErrorText}>Error: {part.errorText}</Text>
                        </View>
                      );
                  }
              }
            })}
          </View>
        ))}

      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask AI to help with your order..."
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
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
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
