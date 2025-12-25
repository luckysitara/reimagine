"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useWallet } from "../context/WalletContext"
import { agentAPI } from "../context/ApiContext"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  messageText: {
    fontSize: 14,
    color: "#ffffff",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  input: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    color: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  suggestedPrompts: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  promptButton: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  promptText: {
    color: "#9ca3af",
    fontSize: 12,
  },
})

export const CopilotScreen: React.FC = () => {
  const { walletAddress } = useWallet()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const suggestedPrompts = [
    "Swap 1 SOL for USDC",
    "Show my portfolio",
    "Create limit order: buy SOL at $140",
    "Analyze news for SOL",
  ]

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || !walletAddress) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await agentAPI.chat(text, walletAddress)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message || "Unable to process request",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {messages.length === 0 ? (
        <View style={styles.suggestedPrompts}>
          <Text style={{ color: "#9ca3af", fontSize: 12, marginVertical: 12 }}>Try one of these:</Text>
          {suggestedPrompts.map((prompt) => (
            <TouchableOpacity key={prompt} style={styles.promptButton} onPress={() => handleSendMessage(prompt)}>
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          )}
          style={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#6b7280"
          value={input}
          onChangeText={setInput}
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && { opacity: 0.5 }]}
          onPress={() => handleSendMessage()}
          disabled={loading || !input.trim()}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.sendButtonText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
