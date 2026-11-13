"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  time: string;
}

interface ProductItem {
  id: number;
  title: string;
  category: string;
  price: number;
  stockStatus: string;
  description: string;
  srcUrl: string;
}

const SUGGESTIONS = [
  "👖 Which jeans are currently in stock?",
  "💰 Can you give me the full price list?",
  "👕 Tell me about your shirts and discounts",
  "📦 Is Blue Jeans available right now?",
  "✨ Recommend an outfit under $80",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "👋 Welcome to Shop.co AI Assistant! I am powered by Gemini 3.6 Flash and connected directly to our real-time Google Sheets inventory. How can I assist you with your shopping today?",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch live Google Sheet products for the sidebar
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data);
        }
      })
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const query = (customText || input).trim();
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
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "model",
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "model",
            text: data.error || "Sorry, I had trouble retrieving product info. Please try again.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: "Network error. Please make sure the server is reachable and try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: "Conversation reset! Feel free to ask about any item in our inventory.",
        time: "Just now",
      },
    ]);
  };

  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-8 md:py-12">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-black/10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black text-white">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Powered by Gemini 3.6 Flash
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Google Sheets Sync
            </span>
          </div>
          <h1
            className={cn([
              integralCF.className,
              "text-3xl md:text-4xl font-bold uppercase text-black",
            ])}
          >
            AI Shopping Assistant
          </h1>
          <p className="text-black/60 text-sm md:text-base mt-1">
            Ask questions about live inventory, prices, stock availability, and styling advice.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 text-sm font-medium border border-black/15 rounded-full hover:bg-neutral-100 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Chat Window: 8 columns on large screens */}
        <div className="lg:col-span-8 flex flex-col h-[650px] bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-neutral-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "model" && (
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-black text-white rounded-tr-none shadow-sm"
                      : "bg-white text-black border border-black/10 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[11px] mt-1.5 text-right ${
                      msg.role === "user" ? "text-white/60" : "text-black/40"
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-neutral-200 text-black flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-black/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                  <span className="w-2 h-2 bg-black/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-black/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-black/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          <div className="p-3 bg-white border-t border-black/5 flex gap-2 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                disabled={isLoading}
                className="whitespace-nowrap text-xs md:text-sm bg-neutral-100 hover:bg-neutral-200 text-black/80 px-3 py-1.5 rounded-full transition border border-black/5"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-white border-t border-black/10 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about our products, stock, or prices..."
              disabled={isLoading}
              className="flex-1 text-sm md:text-base bg-neutral-100 focus:bg-white rounded-full px-5 py-3 outline-none border border-transparent focus:border-black/30 transition placeholder:text-black/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition active:scale-95 shrink-0 shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Live Inventory Sidebar: 4 columns */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="border border-black/10 rounded-2xl p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-black flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Live Inventory
              </h2>
              <span className="text-xs text-black/50 font-medium">From Google Sheet</span>
            </div>

            {loadingProducts ? (
              <div className="py-8 text-center text-black/40 text-sm">
                Loading products from Google Sheets...
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center text-black/40 text-sm">
                No products found in Google Sheet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {products.map((item) => {
                  const isInStock = item.stockStatus?.toLowerCase().includes("in stock");
                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        handleSend(`Tell me more about "${item.title}" - is it in stock and what is its price?`)
                      }
                      className="p-3 rounded-xl border border-black/5 hover:border-black/30 hover:bg-neutral-50 transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-black group-hover:underline">
                            {item.title}
                          </h4>
                          <span className="text-xs text-black/50">{item.category}</span>
                        </div>
                        <span className="font-bold text-sm text-black">${item.price}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            isInStock
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isInStock ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          {item.stockStatus}
                        </span>

                        <span className="text-[11px] text-black/50 group-hover:text-black transition">
                          Click to ask &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border border-black/10 rounded-2xl p-4 bg-neutral-50 text-xs text-black/60 space-y-2">
            <p className="font-semibold text-black">💡 How this works:</p>
            <p>
              This assistant queries <strong>Gemini 3.6 Flash</strong> in real time with the latest data fetched directly from your <strong>5_item_GoogleSheet</strong>.
            </p>
            <p>
              Whenever you update quantities, prices, or status in your Google Sheet, the chatbot immediately reflects those changes for your customers!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

