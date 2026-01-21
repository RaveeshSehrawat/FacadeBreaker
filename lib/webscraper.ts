import axios from "axios";
import * as cheerio from "cheerio";

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export const searchAndScrapeWeb = async (query: string): Promise<string> => {
    console.log("=== WEB SEARCH START ===");
    console.log("Search query:", query);
    
    try {
        // Wrap in a timeout to prevent hanging
        const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Web search timeout")), 8000)
        );

        const searchPromise = (async () => {
            // Using a search API (Google Custom Search API alternative or free option)
            // For demo, we'll use DuckDuckGo which doesn't require authentication
            const searchResults = await searchWeb(query);
            
            console.log("Search results count:", searchResults.length);
            
            if (searchResults.length === 0) {
                console.warn("No search results found for query:", query);
                return "No relevant search results found.";
            }

            console.log("First result:", searchResults[0].title);

            // Scrape the top 3 results for more detailed information
            const scrapedData = await Promise.all(
                searchResults.slice(0, 3).map(async (result) => {
                    try {
                        const content = await scrapeURL(result.url);
                        return {
                            title: result.title,
                            url: result.url,
                            snippet: result.snippet,
                            scrapedContent: content.substring(0, 500), // First 500 chars
                        };
                    } catch {
                        return {
                            title: result.title,
                            url: result.url,
                            snippet: result.snippet,
                            scrapedContent: null,
                        };
                    }
                })
            );

            const resultString = JSON.stringify(scrapedData, null, 2);
            console.log("Returning search results, length:", resultString.length);
            return resultString;
        })();

        return Promise.race([searchPromise, timeoutPromise]);
    } catch (error) {
        console.error("Web scraping error:", error);
        return "Failed to retrieve web sources for verification.";
    }
};

const searchWeb = async (query: string): Promise<SearchResult[]> => {
    try {
        // Using DuckDuckGo HTML search instead of API for better results
        const encodedQuery = encodeURIComponent(query);
        const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            timeout: 5000,
        });

        const results: SearchResult[] = [];
        const $ = cheerio.load(response.data);

        // Parse DuckDuckGo HTML results
        $('.result').each((i, element) => {
            if (i >= 5) return false; // Limit to 5 results
            
            const titleElement = $(element).find('.result__a');
            const snippetElement = $(element).find('.result__snippet');
            const urlElement = $(element).find('.result__url');
            
            const title = titleElement.text().trim();
            const snippet = snippetElement.text().trim();
            let resultUrl = titleElement.attr('href') || '';
            
            // DuckDuckGo uses redirect URLs, extract actual URL
            if (resultUrl.includes('uddg=')) {
                const match = resultUrl.match(/uddg=([^&]+)/);
                if (match) {
                    resultUrl = decodeURIComponent(match[1]);
                }
            }
            
            if (title && resultUrl && !resultUrl.includes('duckduckgo.com')) {
                results.push({
                    title: title || "No title",
                    url: resultUrl,
                    snippet: snippet || "No description available",
                });
            }
        });

        console.log(`DuckDuckGo returned ${results.length} results for: ${query}`);
        return results;
    } catch (error) {
        console.error("Search error:", error instanceof Error ? error.message : "Unknown error");
        return [];
    }
};

const scrapeURL = async (url: string): Promise<string> => {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 3000,
            maxRedirects: 3,
        });

        const $ = cheerio.load(response.data);

        // Remove script and style elements
        $("script, style").remove();

        // Get text content
        let text = $("body").text();

        // Clean up whitespace
        text = text.replace(/\s+/g, " ").trim();

        return text.substring(0, 1000); // Limit to 1000 chars
    } catch (error) {
        console.error(`Error scraping ${url}:`, error instanceof Error ? error.message : "Unknown error");
        throw error;
    }
};
