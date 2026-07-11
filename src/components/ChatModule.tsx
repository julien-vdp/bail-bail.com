"use client";

import React, { useState, useRef, useEffect } from "react";
import { sendMessageAction } from "@/actions/message";
import { Send, Loader2, MessageSquare, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  content: string;
  formattedDate: string;
}

interface ChatModuleProps {
  applicationId: string;
  currentUserId: string;
  currentRole: "CANDIDATE" | "OWNER";
  messages: ChatMessage[];
}

export function ChatModule({
  applicationId,
  currentUserId,
  currentRole,
  messages,
}: ChatModuleProps) {
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setIsPending(true);
    setError("");

    try {
      const res = await sendMessageAction(applicationId, trimmedContent);
      if (res?.error) {
        setError(res.error);
      } else {
        setContent("");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-primary/5 flex flex-col h-[550px] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100/80 bg-gradient-to-r from-white to-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#1463FF]/10 p-2.5 rounded-2xl">
            <MessageSquare className="w-5 h-5 text-[#1463FF]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              Messages & Échanges
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentRole === "CANDIDATE"
                ? "Discutez en direct avec le propriétaire"
                : "Discutez en direct avec le candidat"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="bg-slate-100 p-4 rounded-full border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <div className="max-w-[280px]">
              <h4 className="font-bold text-slate-800 text-sm">Aucun message pour le moment</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Envoyez un premier message pour démarrer la discussion et poser vos questions.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === currentRole;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-[85%] ${
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                    isMe
                      ? "bg-primary text-white border-primary/20"
                      : msg.senderRole === "OWNER"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-blue-50 text-[#1463FF] border-blue-100"
                  }`}
                >
                  {msg.senderRole === "OWNER" ? (
                    <Building className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? "bg-[#1463FF] text-white rounded-tr-none"
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    <p className="font-medium">{msg.content}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-1 text-[10px] text-slate-400 font-semibold ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-4 border-t border-slate-150 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
              rows={2}
              className="flex-1 bg-transparent border-0 outline-none text-slate-800 text-sm font-medium resize-none max-h-24 py-1.5 px-2"
              disabled={isPending}
            />
            <Button
              type="submit"
              disabled={isPending || !content.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 bg-[#1463FF] hover:bg-blue-600 text-white rounded-xl shadow-md transition-all hover:scale-105"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] font-medium text-slate-400 text-center">
            L'envoi d'un message notifie le destinataire par email.
          </p>
        </form>
      </div>
    </div>
  );
}
