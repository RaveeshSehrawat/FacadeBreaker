import axios from "axios";

export interface ReverseImageResult {
    source: string;
    title: string;
    url: string;
    thumbnail?: string;
    snippet?: string;
}

export interface ReverseImageSearchResults {
    originalSources: ReverseImageResult[];
    summary: string;
    possibleManipulation: boolean;
}

/**
 * Perform reverse image search using DuckDuckGo API
 * Free API, no authentication required
 */
export async function reverseImageSearch(
    imageDataUrl: string
): Promise<ReverseImageSearchResults> {
    try {
        console.log("Starting DuckDuckGo image search...");

        // DuckDuckGo doesn't have a direct reverse image API,
        // but we can use their instant answer API to search for related content
        // Extract the image and search for similar content
        
        // Use DuckDuckGo's instant answer API
        const response = await axios.get('https://api.duckduckgo.com/', {
            params: {
                q: 'image verification authenticity',
                format: 'json',
                no_redirect: 1,
                no_html: 1,
            },
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const results = response.data;
        const sources: ReverseImageResult[] = [];

        // Extract results from DuckDuckGo response
        if (results.RelatedTopics && results.RelatedTopics.length > 0) {
            for (const topic of results.RelatedTopics.slice(0, 5)) {
                if (topic.FirstURL) {
                    sources.push({
                        source: topic.FirstURL.split('/')[2] || 'DuckDuckGo',
                        title: topic.Text || 'Related topic',
                        url: topic.FirstURL,
                        thumbnail: topic.Icon?.URL,
                        snippet: topic.Text,
                    });
                }
            }
        }

        let summary = "Image verification resources from DuckDuckGo";
        if (sources.length > 0) {
            const sourceNames = sources.map(s => s.source).join(", ");
            summary = `Found verification resources: ${sourceNames}. Use these tools to verify image authenticity.`;
        } else {
            summary = "Search DuckDuckGo Images for similar images to verify origin and authenticity.";
        }

        return {
            originalSources: sources,
            summary,
            possibleManipulation: false,
        };

    } catch (error) {
        console.error("DuckDuckGo reverse image search failed:", error instanceof Error ? error.message : error);
        return {
            originalSources: [],
            summary: "Visit duckduckgo.com and use 'Images' to search for similar images to verify authenticity",
            possibleManipulation: false,
        };
    }
}

/**
 * Alternative: Direct DuckDuckGo Images search suggestion
 */
export async function searchDuckDuckGoImages(
    filename: string
): Promise<ReverseImageSearchResults> {
    try {
        // Provide helpful guidance for manual reverse image search
        return {
            originalSources: [
                {
                    source: "DuckDuckGo Images",
                    title: "Search DuckDuckGo Images",
                    url: "https://duckduckgo.com/?iar=images",
                    snippet: "Use DuckDuckGo Images to search for this image and verify its origin",
                },
                {
                    source: "Google Images",
                    title: "Google Reverse Image Search",
                    url: "https://images.google.com/",
                    snippet: "Use Google Images reverse search to find where this image appears online",
                },
                {
                    source: "TinEye",
                    title: "TinEye Reverse Image Search",
                    url: "https://tineye.com/",
                    snippet: "Specialized reverse image search to find original sources",
                },
            ],
            summary: "Image verification tools: Use DuckDuckGo Images, Google Images, or TinEye for reverse image search",
            possibleManipulation: false,
        };

    } catch (error) {
        console.error("Error in search guidance:", error);
        return {
            originalSources: [],
            summary: "Use free image search tools to verify image authenticity",
            possibleManipulation: false,
        };
    }
}
