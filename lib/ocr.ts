/**
 * Extract text from image using OCR
 * @param imageDataUrl - Base64 encoded image data URL
 * @returns Extracted text from the image
 */
export const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
    try {
        // Don't strip data URL prefix here - let the API handle it
        const response = await fetch("/api/ocr", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                base64Image: imageDataUrl,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "OCR processing failed");
        }

        if (!data.text) {
            throw new Error("No text could be extracted from the image");
        }

        return data.text;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "OCR extraction failed";
        throw new Error(`Failed to extract text from image: ${errorMsg}`);
    }
};
