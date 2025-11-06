import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Send, Sparkles, X } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { useRorkAgent } from "@/lib/rork-toolkit-sdk";

interface AIChatbotProps {
  onClose: () => void;
  visible: boolean;
}

export default function AIChatbot({ onClose, visible }: AIChatbotProps) {
  const { language } = useLanguage();
  const { selectedTable } = useRestaurant();
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const hasShownWelcome = useRef(false);

  const systemPrompt = `You are Baran, an AI waiter assistant at Tapse Kurdish Restaurant.
You are multilingual and can speak English, Kurdish (Sorani), and Arabic fluently with perfect understanding.
You help customers place orders, track their meals, answer questions about menu items, and call staff when needed.
The current table is ${selectedTable}.

Language Rules:
- If the customer writes in Kurdish (کوردی), reply in Kurdish
- If the customer writes in Arabic (عربي), reply in Arabic
- If the customer writes in English, reply in English
- You can understand and switch between all three languages seamlessly
- Maintain the same language throughout the conversation unless the customer switches

Personality:
- Be warm, welcoming, and helpful
- Use culturally appropriate greetings and expressions
- Show Kurdish hospitality and friendliness
- Be professional yet personable
- Help customers feel comfortable and valued

Capabilities:
- Answer questions about menu items, ingredients, and preparation
- Help customers place orders
- Track order status
- Call waiters or staff when needed
- Provide recommendations based on preferences
- Assist with special dietary requirements or allergies
- Explain Kurdish dishes and traditions

Remember: You represent Tapse's commitment to excellent customer service in all languages.`;

  const { messages, sendMessage: sendRorkMessage } = useRorkAgent({
    systemPrompt,
    tools: {},
  });

  const sendMessage = () => {
    if (!input.trim()) return;
    const message = input;
    setInput("");
    sendRorkMessage(message);
  };

  useEffect(() => {
    if (visible && !hasShownWelcome.current) {
      const welcomeMessage = language === 'ku' 
        ? `بەخێربێیت بۆ تەپسی سلێمانی! 🌟\n\nمن بارانم، یاریدەدەری زیرەکی دیجیتاڵیت. دەتوانم یارمەتیت بدەم لە:\n\n✨ پرسیار لەسەر مینیو و خواردنەکان\n🍽️ داواکردنی خواردن\n📋 شوێنکەوتنی داواکاریەکەت\n👋 بانگهێشتنی گارسۆن\n\nچۆن دەتوانم یارمەتیت بدەم ئەمڕۆ؟ 😊`
        : language === 'ar'
        ? `مرحباً بك في مطعم تابسي السليماني! 🌟\n\nأنا باران، مساعدك الرقمي الذكي. يمكنني مساعدتك في:\n\n✨ الاستفسار عن القائمة والأطباق\n🍽️ طلب الطعام\n📋 تتبع طلبك\n👋 استدعاء النادل\n\nكيف يمكنني مساعدتك اليوم؟ 😊`
        : `Welcome to Tapse Sulaymaniyah! 🌟\n\nI'm Baran, your digital AI assistant. I can help you with:\n\n✨ Questions about menu and dishes\n🍽️ Placing orders\n📋 Tracking your order\n👋 Calling a waiter\n\nHow may I assist you today? 😊`;
      
      sendRorkMessage(welcomeMessage);
      hasShownWelcome.current = true;
    }
    
    if (!visible) {
      hasShownWelcome.current = false;
    }
  }, [visible, language, sendRorkMessage]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Sparkles size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {language === 'ku' ? 'یاریدەدەری AI بارانم' : language === 'ar' ? 'مساعد بارانم الذكي' : 'Baran AI Assistant'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {language === 'ku' ? 'چۆخدارە دیجیتاڵیت لە تەپسی' : language === 'ar' ? 'نادلك الرقمي في تابسي' : 'Your digital waiter at Tapse'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={styles.messages}>
        {messages.map((msg) => (
          <View key={msg.id}>
            {msg.parts.map((part: any, i: number) => {
              if (part.type === "text") {
                return (
                  <View
                    key={`${msg.id}-${i}`}
                    style={[
                      styles.message,
                      msg.role === "user" ? styles.userMsg : styles.aiMsg,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === "user" ? styles.userText : styles.aiText,
                      ]}
                    >
                      {part.text}
                    </Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inputRow}
      >
        <TextInput
          style={styles.input}
          placeholder={language === 'ku' ? 'پرسیار لە بارانم بکە...' : language === 'ar' ? 'اسأل بارانم...' : 'Ask Baran...'}
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[
            styles.sendButton,
            !input.trim() && { backgroundColor: Colors.backgroundGray },
          ]}
          disabled={!input.trim()}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary },
  closeButton: { padding: 4 },
  messages: { flex: 1, padding: 12 },
  message: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: "80%",
  },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
  },
  aiMsg: {
    alignSelf: "flex-start",
    backgroundColor: Colors.backgroundGray,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: "#fff" },
  aiText: { color: Colors.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
