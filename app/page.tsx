"use client";

import { useState } from "react";
import ChatContainer from "@/components/ChatContainer";
import ImageAnalyzer from "@/components/ImageAnalyzer";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, MessageCircle, Image } from "lucide-react";

type TabType = "Fact/News Checker" | "Deepfake/AI Detector";

export default function Home() {
    const { isDark, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>("Fact/News Checker");

    return (
        <main className="relative w-full h-screen flex flex-col bg-white dark:bg-gray-950 text-black dark:text-white overflow-hidden">
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: isDark 
                        ? "url('/dark-theme-burst.jpg')" 
                        : "url('/light-theme-burst.jpg')"
                }}
                aria-hidden
            />

            <div className="relative z-20 w-full flex items-center justify-between px-4 md:px-8 py-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700/40">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-indigo-200">
                        TruthLens AI
                    </h1>
                    <span className="px-3 py-1 text-xs rounded-full bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100 border border-blue-200/40 dark:border-blue-400/30">
                        Gemini
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-2 bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("Fact/News Checker")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                                activeTab === "Fact/News Checker"
                                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                            }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden md:inline">Fact/News Checker</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("Deepfake/AI Detector")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                                activeTab === "Deepfake/AI Detector"
                                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                            }`}
                        >
                            <Image className="w-4 h-4" />
                            <span className="hidden md:inline">Deepfake/AI Detector</span>
                        </button>
                    </div>
                    
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-yellow-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                        aria-label="Toggle theme"
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex-1 w-full px-4 md:px-8 pb-8 flex flex-col min-h-0">
                <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
                    {activeTab === "Fact/News Checker" ? <ChatContainer /> : <ImageAnalyzer />}
                </div>
            </div>
        </main>
    );
}
