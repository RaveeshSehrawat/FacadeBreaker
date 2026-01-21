"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { Upload, Loader2, X } from "lucide-react";

interface ImageMessage {
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

const ImageAnalyzer: React.FC = () => {
    const [messages, setMessages] = useState<ImageMessage[]>([
        {
            role: "bot",
            content: "Upload an image or screenshot, and I'll analyze its authenticity, detect AI-generated content, and check for manipulations.",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage || !imagePreview) return;

        const fileData = {
            name: selectedImage.name,
            type: selectedImage.type,
            size: selectedImage.size,
            dataUrl: imagePreview,
        };

        const newMessage: ImageMessage = {
            role: "user",
            content: `Analyzing image: ${selectedImage.name}`,
            file: fileData,
        };
        setMessages((prev) => [...prev, newMessage]);
        setLoading(true);

        try {
            // Check authenticity first
            let authenticityResult = undefined;
            try {
                const authResponse = await fetch("/api/check-authenticity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl: imagePreview }),
                });
                if (authResponse.ok) {
                    authenticityResult = await authResponse.json();
                }
            } catch (authError) {
                console.warn("Authenticity check failed:", authError);
            }

            // Classify the image
            const classifyResponse = await fetch("/api/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: `Please analyze this image for authenticity and provide detailed analysis.`,
                    file: fileData,
                }),
            });

            if (!classifyResponse.ok) {
                const errorData = await classifyResponse.json();
                throw new Error(errorData.error || "Classification failed");
            }

            const classificationResult = await classifyResponse.json();

            const botMessage: ImageMessage = {
                role: "bot",
                content: "Image analysis complete",
                classification: classificationResult,
                authenticity: authenticityResult,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Analysis failed";

            const errorBotMessage: ImageMessage = {
                role: "bot",
                content: `Error: ${errorMessage}`,
            };

            setMessages((prev) => [...prev, errorBotMessage]);
        } finally {
            setLoading(false);
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                        authenticity={msg.authenticity}
                    />
                ))}
            </div>

            <div className="relative z-10 p-4 border-t border-gray-100/40 dark:border-gray-700/40 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md flex-shrink-0 space-y-3">
                {imagePreview && (
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Selected for analysis"
                            className="w-full max-h-32 object-contain rounded-lg border border-blue-300 dark:border-blue-700"
                        />
                        <button
                            onClick={clearImage}
                            disabled={loading}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            title="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex-1 p-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 glow-button"
                        title="Upload image"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Choose Image</span>
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedImage || loading}
                        className="flex-1 p-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 glow-button"
                        title="Analyze image"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <span>Analyze</span>
                        )}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />

                <p className="text-xs text-gray-400 text-center">
                    AI can make mistakes. Please verify important information.
                </p>
            </div>
        </div>
    );
};

export default ImageAnalyzer;
