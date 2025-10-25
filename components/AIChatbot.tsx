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
import { Send, Sparkles, X, Info, Bell, Users, MessageCircle } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRestaurant } from "@/contexts/RestaurantContext";

interface AIChatbotProps {
  onClose: () => void;
  visible: boolean;
}

export default function AIChatbot({ onClose, visible }: AIChatbotProps) {
  const { t, language } = useLanguage();
  const { selectedTable } = useRestaurant();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // 🌍 SYSTEM prompt - multilingual support
  const systemPrompt = `You are Baran, an AI waiter assistant at Tapse Kurdish Restaurant.
You are multilingual and can speak English, Kurdish (Sorani), and Arabic fluently.
You help customers place orders, track their meals, and call staff when needed.
The current table is ${selectedTable}.
If the customer writes in Kurdish, reply in Kurdish. If in Arabic, reply in Arabic. If in English, reply in English.
Be warm, welcoming, and helpful. Use culturally appropriate greetings and expressions.
You understand all three languages equally well and can switch between them naturally.`;

  // 🧠 Send message to OpenAI API (real responses)
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    const updated = [...messages, newMessage];
    setMessages(updated);
    setInput("");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              ...updated.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            ],
          }),
        }
      );

      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || "Sorry, I couldn’t respond.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Network error. Try again." },
      ]);
    }
  };

  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeMessage = language === 'ku' 
        ? "سڵاو! من بارانم، یاریدەدەری AI ـی تەپسی. چۆن دەتوانم یارمەتیت بدەم؟ 🌟" 
        : language === 'ar'
        ? "مرحباً! أنا باران، مساعدك الذكي في مطعم تابسي. كيف يمكنني مساعدتك؟ 🌟"
        : "Hello! I'm Baran, your AI assistant at Tapse Restaurant. How may I help you today? 🌟";
      
      setMessages([
        {
          role: "assistant",
          content: welcomeMessage,
        },
      ]);
    }
  }, [visible, language]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.messages}>
        {messages.map((msg, i) => (
          <View
            key={i}
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
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
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