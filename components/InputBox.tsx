"use client";

import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface InputBoxProps {
    onSend: (text: string) => void;
    loading: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ onSend, loading }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            onSend(input);
            setInput("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full relative animate-fade-in-up">
            <div className="relative flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste news text or URL here..."
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
                    type="submit"
                    disabled={!input.trim() || loading}
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
