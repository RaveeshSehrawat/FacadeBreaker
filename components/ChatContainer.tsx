"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import { extractTextFromImage } from "@/lib/ocr";

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
        let processedText = text;

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

            // If image file, extract text using OCR (silently fail if not working)
            if (file.type.startsWith('image/')) {
                try {
                    processedText = await extractTextFromImage(dataUrl);
                    console.log("OCR extracted text:", processedText);
                    if (!processedText || processedText.trim().length === 0) {
                        console.warn("OCR returned empty text");
                    }
                } catch (ocrError) {
                    console.warn("OCR extraction failed, continuing without text extraction:", ocrError);
                    // Continue without OCR text - user can paste manually if needed
                }
            }
        }

        const newMessage: Message = { 
            role: "user", 
            content: file ? `[Image: ${file.name}]` : text,
            file: fileData,
        };
        setMessages((prev) => [...prev, newMessage]);
        setLoading(true);

        try {
            // Use the OCR extracted text or the user provided text for classification
            const textToAnalyze = processedText || text;
            
            console.log("Sending to classify API:", {
                textLength: textToAnalyze?.length,
                hasFile: !!file,
                text: textToAnalyze?.substring(0, 100)
            });

            const response = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textToAnalyze, file: fileData }),
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
