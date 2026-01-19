"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";

interface Message {
    role: "user" | "bot";
    content: string;
    classification?: {
        label: string;
        confidence: number;
        reason: string;
    };
}

const ChatContainer: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            content: "Hello! I'm TruthLens. Paste any news article or headline, and I'll help you verify its authenticity.",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        // Add user message
        const newMessage: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, newMessage]);
        setLoading(true);

        try {
            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: "Here's what I found:",
                    classification: data,
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: "Sorry, I encountered an error while analyzing that. Please try again.",
                },
            ]);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={idx}
                        role={msg.role}
                        content={msg.content}
                        classification={msg.classification}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <InputBox onSend={handleSend} loading={loading} />
            </div>
        </div>
    );
};

export default ChatContainer;
