import React from "react";

interface MessageBubbleProps {
    role: "user" | "bot";
    content: string;
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
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    role,
    content,
    classification,
}) => {
    const isUser = role === "user";

    const getVerdictTone = (label?: string) => {
        switch (label?.toLowerCase()) {
            case "fake":
                return "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-700/70 dark:text-red-200";
            case "real":
                return "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/40 dark:border-green-700/70 dark:text-green-200";
            case "uncertain":
                return "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/40 dark:border-yellow-700/70 dark:text-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700";
        }
    };

    const getLabelColor = (label?: string) => {
        switch (label?.toLowerCase()) {
            case "fake":
                return "bg-red-100 text-red-800 border-red-200";
            case "real":
                return "bg-green-100 text-green-800 border-green-200";
            case "uncertain":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getTruthEstimate = (label?: string, confidence?: number) => {
        if (!label || confidence === undefined) return null;
        
        const conf = confidence || 0;
        
        switch (label.toLowerCase()) {
            case "real":
                return {
                    text: `${conf}% likely TRUE`,
                    color: "text-green-600 dark:text-green-400",
                    bgColor: "bg-green-100/50 dark:bg-green-950/50",
                    icon: "✓"
                };
            case "fake":
                return {
                    text: `${conf}% likely FALSE`,
                    color: "text-red-600 dark:text-red-400",
                    bgColor: "bg-red-100/50 dark:bg-red-950/50",
                    icon: "✕"
                };
            case "uncertain":
                return {
                    text: `${conf}% uncertain`,
                    color: "text-yellow-600 dark:text-yellow-400",
                    bgColor: "bg-yellow-100/50 dark:bg-yellow-950/50",
                    icon: "?"
                };
            default:
                return null;
        }
    };

    return (
        <div className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"} animate-bubble-pop`}>
            <div
                className={`max-w-[80%] rounded-lg p-4 shadow-lg border transition-transform duration-200 ${isUser
                        ? "bg-gray-200 text-black border-gray-300 rounded-br-none dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        : "bg-white text-black border-gray-300 rounded-bl-none dark:bg-gray-900 dark:text-white dark:border-gray-700"
                    } hover:-translate-y-0.5`}
            >
                <p className="whitespace-pre-wrap leading-relaxed">{content}</p>

                {classification && (
                    <div className="mt-2 space-y-2 text-xs">
                        {/* AI Analysis Section */}
                        <div className={`p-2 rounded border pulse-border ${getVerdictTone(classification.label)}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
                                    </svg>
                                    <span className="font-semibold">AI Analysis</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${getLabelColor(classification.label)}`}>
                                        {classification.label.toUpperCase()}
                                    </span>
                                    <span className="font-semibold">{classification.confidence}%</span>
                                </div>
                            </div>
                            <p className="opacity-90 leading-snug mb-2">{classification.aiReasoning}</p>
                            
                            {/* Truthfulness Estimate */}
                            {getTruthEstimate(classification.label, classification.confidence) && (
                                <div className={`${getTruthEstimate(classification.label, classification.confidence)?.bgColor} rounded px-2 py-1.5 mt-2 flex items-center gap-1.5`}>
                                    <span className={`text-sm font-bold ${getTruthEstimate(classification.label, classification.confidence)?.color}`}>
                                        {getTruthEstimate(classification.label, classification.confidence)?.icon}
                                    </span>
                                    <span className={`text-xs font-semibold ${getTruthEstimate(classification.label, classification.confidence)?.color}`}>
                                        {getTruthEstimate(classification.label, classification.confidence)?.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Web Sources Summary */}
                        {classification.webSourcesSummary && classification.webSourcesSummary !== "No web sources available" && (
                            <div className="p-2 rounded border bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700/70 dark:text-blue-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-semibold">What Web Sources Say</span>
                                </div>
                                <p className="opacity-90 leading-snug">{classification.webSourcesSummary}</p>
                            </div>
                        )}

                        {/* Web Search Results Section */}
                        {classification.webSearchResults && classification.webSearchResults.length > 0 && (
                            <details className="p-2 rounded border bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-700/70 dark:text-blue-200">
                                <summary className="cursor-pointer font-semibold flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    View {classification.webSearchResults.length} Source{classification.webSearchResults.length > 1 ? 's' : ''}
                                </summary>
                                <div className="space-y-1.5 mt-2">
                                    {classification.webSearchResults.map((result, idx) => (
                                        <div key={idx} className="p-1.5 bg-white/50 dark:bg-gray-900/50 rounded border border-current/10">
                                            <a 
                                                href={result.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="font-medium hover:underline block leading-tight"
                                            >
                                                {result.title}
                                            </a>
                                            <p className="opacity-75 mt-0.5 leading-snug">{result.snippet}</p>
                                            <a 
                                                href={result.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[10px] underline opacity-50 hover:opacity-100 transition-opacity block mt-0.5 truncate"
                                            >
                                                {result.url}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}

                        {/* No Web Results Message */}
                        {classification.webSearchStatus === "unavailable" && (
                            <div className="p-1.5 rounded border bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800/40 dark:border-gray-600/70 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p>Web search unavailable</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
