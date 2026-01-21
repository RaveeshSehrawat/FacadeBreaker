"use client";

import React, { useState, useRef } from "react";
import { Send, Loader2, Image } from "lucide-react";

interface InputBoxProps {
    onSend: (text: string, file?: File) => void;
    loading: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ onSend, loading }) => {
    const [input, setInput] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((input.trim() || selectedFile) && !loading) {
            onSend(
                input || (selectedFile ? `[Image: ${selectedFile.name}]` : ""),
                selectedFile || undefined
            );
            setInput("");
            setSelectedFile(null);
            // Reset file inputs so same file can be uploaded again
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full relative animate-fade-in-up">
            {selectedFile && (
                <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-between border border-blue-300 dark:border-blue-700">
                    <span className="text-sm text-blue-900 dark:text-blue-200">
                        📎 🖼️ {selectedFile.name} {selectedFile.type.startsWith('image') ? '(will extract text via OCR)' : ''}
                    </span>
                    <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="relative flex items-end gap-2">
                <div className="flex-1 flex gap-1">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste news text, URL, or upload an image to extract and verify text..."
                        className="flex-1 p-4 rounded-xl border border-gray-400 dark:border-gray-500 bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm min-h-[60px] max-h-[120px] transition-all duration-200 focus:shadow-glow focus:-translate-y-0.5 backdrop-blur-sm"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex-shrink-0 p-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors glow-button h-[60px] w-[60px] flex items-center justify-center"
                        title="Upload image"
                        disabled={loading}
                    >
                        <Image className="w-5 h-5" />
                    </button>
                </div>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />
                <button
                    type="submit"
                    disabled={!input.trim() && !selectedFile || loading}
                    className="flex-shrink-0 p-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors glow-button h-[60px] w-[60px] flex items-center justify-center"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
                AI can make mistakes. Please verify important information.
            </p>
        </form>
    );
};

export default InputBox;
