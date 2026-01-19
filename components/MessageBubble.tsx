import React from "react";

interface MessageBubbleProps {
    role: "user" | "bot";
    content: string;
    classification?: {
        label: string;
        confidence: number;
        reason: string;
        sources?: string[];
        verdict?: string;
        webEvidenceWeight?: number;
    };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    role,
    content,
    classification,
}) => {
    const isUser = role === "user";

    const getVerdictColor = (verdict?: string) => {
        const v = verdict?.toLowerCase();
        switch (v) {
            case "fake":
            case "false":
            case "fraud":
            case "contradicted by web sources":
                return "text-red-600 dark:text-red-400";
            case "real":
            case "true":
            case "verified":
            case "verified by web sources":
                return "text-green-600 dark:text-green-400";
            case "uncertain":
            case "unknown":
            case "mixed":
            case "partially verified":
            case "insufficient web evidence":
                return "text-yellow-600 dark:text-yellow-400";
            default:
                return "";
        }
    };

    const getVerdictTone = (verdict?: string) => {
        const v = verdict?.toLowerCase();
        switch (v) {
            case "fake":
            case "false":
            case "fraud":
            case "contradicted by web sources":
                return "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-700/70 dark:text-red-200";
            case "real":
            case "true":
            case "verified":
            case "verified by web sources":
                return "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/40 dark:border-green-700/70 dark:text-green-200";
            case "uncertain":
            case "unknown":
            case "mixed":
            case "partially verified":
            case "insufficient web evidence":
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
                    <div className={`mt-3 p-3 rounded border text-sm pulse-border ${getVerdictTone(classification.verdict)}`}>
                        <div className="flex justify-between items-center mb-1 font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getLabelColor(classification.label)}`}>
                                {classification.label.toUpperCase()}
                            </span>
                            <span>{classification.confidence}%</span>
                        </div>
                        <p className="italic opacity-90">{classification.reason}</p>
                        
                        {classification.verdict && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                                <p className="font-semibold text-xs">
                                    Verdict: 
                                    <span className={`ml-1 ${getVerdictColor(classification.verdict)}`}>
                                        {classification.verdict}
                                    </span>
                                </p>
                                {classification.webEvidenceWeight !== undefined && (
                                    <div className="mt-1 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Web Evidence Influence:</span>
                                            <span className="font-semibold">{classification.webEvidenceWeight}%</span>
                                        </div>
                                        <div className="w-full bg-current/20 rounded-full h-1.5">
                                            <div 
                                                className="bg-current h-1.5 rounded-full transition-all duration-500" 
                                                style={{ width: `${classification.webEvidenceWeight}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {classification.sources && classification.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                                <p className="font-semibold text-xs mb-1">Sources Used for Verification:</p>
                                <ul className="text-xs space-y-1">
                                    {classification.sources.map((source, idx) => (
                                        <li key={idx} className="truncate">
                                            <a 
                                                href={source} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="underline hover:opacity-70 transition-opacity"
                                            >
                                                {source.substring(0, 50)}...
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
