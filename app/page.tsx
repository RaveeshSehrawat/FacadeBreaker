"use client";

import ChatContainer from "@/components/ChatContainer";
import MeteorLayer from "@/components/MeteorLayer";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function Home() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <main className="relative w-full h-screen flex flex-col bg-white dark:bg-gray-950 text-black dark:text-white overflow-hidden">
            <div className="starfield" aria-hidden>
                <div className="stars" />
                <MeteorLayer count={24} className="meteors" />
            </div>

            <div className="relative z-20 w-full flex items-center justify-between px-4 md:px-8 py-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-indigo-200">
                        TruthLens AI
                    </h1>
                    <span className="px-3 py-1 text-xs rounded-full bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100 border border-blue-200/40 dark:border-blue-400/30">
                        Gemini
                    </span>
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

            <div className="relative z-10 flex-1 w-full px-4 md:px-8 pb-8 flex flex-col min-h-0">
                <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
                    <ChatContainer />
                </div>
            </div>
        </main>
    );
}
