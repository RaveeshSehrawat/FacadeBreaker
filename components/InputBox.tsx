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
        <form onSubmit={handleSubmit} className="w-full relative">
            <div className="relative flex items-center">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste news text or URL here..."
                    className="w-full p-4 pr-14 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm min-h-[60px] max-h-[120px]"
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
                    className="absolute right-3 p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
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
