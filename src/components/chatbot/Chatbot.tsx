"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  time?: string;
}

const QUICK_PROMPTS = [
  "👖 Which jeans are in stock?",
  "👕 What shirts do you have?",
  "💰 Can you list all prices?",
  "📦 Is Blue Jeans available?",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "👋 Hi! I'm your Shop.co AI Sales Assistant. I'm connected directly to our live Google Sheets inventory. Ask me anything about our products, stock, or prices!",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history,
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: data.error || "Sorry, I had trouble retrieving product info. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "Network error. Please make sure the server is reachable and try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: "Chat cleared! How can I help you today with our items in stock?",
        time: "Just now",
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-black text-white px-5 py-3.5 rounded-full shadow-2xl hover:bg-neutral-800 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open support chat"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="font-medium text-sm hidden sm:inline">Ask AI Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex flex-col w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-black text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                  Shop.co Assistant
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                </h3>
                <p className="text-[11px] text-white/70">
                  Gemini 3.6 Flash • Live Google Sheets
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "model" && (
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-black text-white rounded-tr-none shadow-sm"
                      : "bg-white text-black border border-black/10 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                  {msg.time && (
                    <div
                      className={`text-[10px] mt-1 text-right ${
                        msg.role === "user" ? "text-white/60" : "text-black/40"
                      }`}
                    >
                      {msg.time}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-neutral-200 text-black flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-black/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-black/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-black/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-black/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t border-black/5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-xs bg-neutral-100 hover:bg-neutral-200 text-black/80 px-2.5 py-1 rounded-full transition border border-black/5"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-black/10 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, stock, prices..."
              disabled={isLoading}
              className="flex-1 text-sm bg-neutral-100 focus:bg-white rounded-full px-4 py-2.5 outline-none border border-transparent focus:border-black/30 transition placeholder:text-black/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition active:scale-95 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

