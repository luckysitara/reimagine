"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import Icon from "react-native-vector-icons/Feather"
import { useWallet } from "../context/WalletContext"

interface Message {
  id: string
  text: string
  sender: "user" | "copilot"
  timestamp: Date
}

const CopilotScreen = () => {
  const { selectedAccount } = useWallet()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I am your AI trading assistant. How can I help you today?",
      sender: "copilot",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setLoading(true)

    try {
      // Call the backend API to get AI response
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPublicKey: selectedAccount?.toString(),
          userMessage: inputText,
        }),
      })

      const data = await response.json()

      const copilotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || "I had trouble processing that. Please try again.",
        sender: "copilot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, copilotMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "copilot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.message, message.sender === "user" ? styles.userMessage : styles.copilotMessage]}
          >
            <View style={[styles.messageBubble, message.sender === "user" ? styles.userBubble : styles.copilotBubble]}>
              <Text style={[styles.messageText, message.sender === "user" ? styles.userText : styles.copilotText]}>
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.message, styles.copilotMessage]}>
            <View style={[styles.messageBubble, styles.copilotBubble]}>
              <ActivityIndicator color="#3b82f6" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Icon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  message: {
    marginBottom: 12,
    flexDirection: "row",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  copilotMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#3b82f6",
  },
  copilotBubble: {
    backgroundColor: "#1e293b",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
  },
  copilotText: {
    color: "#e2e8f0",
  },
  inputContainer: {
    backgroundColor: "#0f172a",
    borderTopColor: "#1e293b",
    borderTopWidth: 1,
    padding: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderColor: "#334155",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})

export default CopilotScreen
