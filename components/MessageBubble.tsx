import React from "react";

interface MessageBubbleProps {
    role: "user" | "bot";
    content: string;
    classification?: {
        label: string;
        confidence: number;
        reason: string;
    };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    role,
    content,
    classification,
}) => {
    const isUser = role === "user";

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
        <div className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[80%] rounded-lg p-4 shadow-sm border ${isUser
                        ? "bg-blue-600 text-white border-blue-600 rounded-br-none"
                        : "bg-white text-gray-800 border-gray-200 rounded-bl-none"
                    }`}
            >
                <p className="whitespace-pre-wrap">{content}</p>

                {classification && (
                    <div className={`mt-3 p-3 rounded border text-sm ${getLabelColor(classification.label)}`}>
                        <div className="flex justify-between items-center mb-1 font-bold">
                            <span>{classification.label.toUpperCase()}</span>
                            <span>{classification.confidence}%</span>
                        </div>
                        <p className="italic">{classification.reason}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
