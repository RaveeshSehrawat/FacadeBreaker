"use client";

import { useState } from "react";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface AuthenticityResult {
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
}

export default function PhotoAuthenticityChecker() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AuthenticityResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size too large. Please upload an image under 10MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
            setResult(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const analyzePhoto = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/check-authenticity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageDataUrl: selectedImage,
                    mode: "detailed", // or "quick" for faster analysis
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            setResult(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to analyze photo");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getStatusIcon = () => {
        if (!result) return null;

        if (result.isAuthentic) {
            return <CheckCircle className="w-12 h-12 text-green-500" />;
        } else if (result.confidence > 70) {
            return <XCircle className="w-12 h-12 text-red-500" />;
        } else {
            return <AlertCircle className="w-12 h-12 text-yellow-500" />;
        }
    };

    const getStatusText = () => {
        if (!result) return "";

        if (result.isAuthentic && result.confidence > 70) {
            return "Likely Authentic";
        } else if (!result.isAuthentic && result.confidence > 70) {
            return "Likely Fake/Manipulated";
        } else {
            return "Uncertain";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <h1 className="text-4xl font-bold text-white mb-2 text-center">
                        Photo Authenticity Checker
                    </h1>
                    <p className="text-gray-300 text-center mb-8">
                        Detect AI-generated images and photo manipulations
                    </p>

                    {/* Upload Area */}
                    <div className="mb-6">
                        <label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-800/50"
                        >
                            {selectedImage ? (
                                <img
                                    src={selectedImage}
                                    alt="Selected"
                                    className="max-h-full max-w-full object-contain rounded-lg"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                    <p className="text-gray-300 text-sm font-semibold">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-gray-400 text-xs">PNG, JPG, WEBP (MAX. 10MB)</p>
                                </div>
                            )}
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Analyze Button */}
                    {selectedImage && (
                        <button
                            onClick={analyzePhoto}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Analyze Photo Authenticity"
                            )}
                        </button>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                            <p className="text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Results Display */}
                    {result && (
                        <div className="mt-8 space-y-6">
                            {/* Main Status */}
                            <div className="flex items-center justify-center gap-4 p-6 bg-gray-800/50 rounded-lg">
                                {getStatusIcon()}
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{getStatusText()}</h2>
                                    <p className="text-gray-300">
                                        Confidence: {result.confidence}%
                                    </p>
                                </div>
                            </div>

                            {/* AI Generation Detection */}
                            {result.indicators.aiGeneration.detected && (
                                <div className="p-6 bg-red-900/30 border border-red-500 rounded-lg">
                                    <h3 className="text-xl font-bold text-red-300 mb-3 flex items-center gap-2">
                                        <XCircle className="w-6 h-6" />
                                        AI Generation Detected
                                    </h3>
                                    <p className="text-gray-300 mb-3">
                                        Confidence: {result.indicators.aiGeneration.confidence}%
                                    </p>
                                    {result.indicators.aiGeneration.evidence.length > 0 && (
                                        <div>
                                            <p className="text-gray-300 font-semibold mb-2">Evidence:</p>
                                            <ul className="list-disc list-inside space-y-1 text-gray-400">
                                                {result.indicators.aiGeneration.evidence.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manipulation Detection */}
                            {result.indicators.manipulation.detected && (
                                <div className="p-6 bg-orange-900/30 border border-orange-500 rounded-lg">
                                    <h3 className="text-xl font-bold text-orange-300 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-6 h-6" />
                                        Manipulation Detected
                                    </h3>
                                    <p className="text-gray-300 mb-3">
                                        Confidence: {result.indicators.manipulation.confidence}%
                                    </p>
                                    {result.indicators.manipulation.evidence.length > 0 && (
                                        <div>
                                            <p className="text-gray-300 font-semibold mb-2">Evidence:</p>
                                            <ul className="list-disc list-inside space-y-1 text-gray-400">
                                                {result.indicators.manipulation.evidence.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Detailed Reasoning */}
                            <div className="p-6 bg-gray-800/50 rounded-lg">
                                <h3 className="text-xl font-bold text-white mb-3">Detailed Analysis</h3>
                                <p className="text-gray-300 leading-relaxed">{result.reasoning}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
