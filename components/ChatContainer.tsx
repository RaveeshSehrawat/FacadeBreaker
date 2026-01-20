"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import MeteorLayer from "./MeteorLayer";

interface Message {
    role: "user" | "bot";
    content: string;
    file?: {
        name: string;
        type: string;
        size: number;
        dataUrl?: string;
    };
    classification?: {
        label: string;
        confidence: number;
        aiReasoning: string;
        webSourcesSummary: string;
        webSearchResults?: Array<{
            title: string;
            url: string;
            snippet: string;
            scrapedContent?: string | null;
        }>;
        webSearchStatus?: string;
    };
    authenticity?: {
        isAuthentic: boolean;
        confidence: number;
        reasoning: string;
        indicators: {
            aiGeneration: {
                detected: boolean;
                confidence: number;
                evidence: string[];
            };
            manipulation: {
                detected: boolean;
                confidence: number;
                evidence: string[];
            };
        };
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
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string, file?: File) => {
        // Add user message
        let fileData = undefined;
        if (file) {
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
            fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl,
            };
        }

        const newMessage: Message = { 
            role: "user", 
            content: text || `Analyzing ${file?.type.startsWith('image') ? 'image' : 'video'}: ${file?.name}`,
            file: fileData,
        };
        setMessages((prev) => [...prev, newMessage]);
        setLoading(true);

        try {
            // If image is uploaded, check authenticity first
            let authenticityResult = undefined;
            if (file && file.type.startsWith('image/') && fileData?.dataUrl) {
                try {
                    const authResponse = await fetch("/api/check-authenticity", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imageDataUrl: fileData.dataUrl }),
                    });

                    if (authResponse.ok) {
                        const authData = await authResponse.json();
                        authenticityResult = authData.data;
                        
                        // Add authenticity check result message
                        const authMessage = authenticityResult.isAuthentic
                            ? `✓ Photo appears authentic (${authenticityResult.confidence}% confidence)`
                            : `⚠️ Photo may be ${authenticityResult.indicators.aiGeneration.detected ? 'AI-generated' : 'manipulated'} (${authenticityResult.confidence}% confidence)`;
                        
                        setMessages((prev) => [
                            ...prev,
                            {
                                role: "bot",
                                content: authMessage,
                                authenticity: authenticityResult,
                            },
                        ]);
                    }
                } catch (authError) {
                    console.error("Authenticity check failed:", authError);
                }
            }

            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text || newMessage.content, file: fileData }),
            });

            const data = await response.json();

            // Surface server-side debug info in dev to avoid opaque "Something went wrong"
            if (!response.ok) {
                const details =
                    data?.reason ||
                    data?.debugInfo ||
                    data?.error ||
                    "Something went wrong";
                throw new Error(details);
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
            const message = error instanceof Error ? error.message : "Unknown error";
            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: `Sorry, I encountered an error while analyzing that. ${message}`,
                },
            ]);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative isolate flex flex-col w-full flex-1 rounded-2xl border border-gray-100/40 dark:border-gray-700/40 overflow-hidden glass-panel glass-panel-dark animate-fade-in-up">
            <MeteorLayer count={16} className="opacity-90" />
            <div
                ref={messagesContainerRef}
                className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-950 min-h-0"
            >
                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={idx}
                        role={msg.role}
                        content={msg.content}
                        file={msg.file}
                        classification={msg.classification}
                    />
                ))}
            </div>
            <div className="relative z-10 p-4 border-t border-gray-100/40 dark:border-gray-700/40 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md flex-shrink-0">
                <InputBox onSend={handleSend} loading={loading} />
            </div>
        </div>
    );
};

export default ChatContainer;
