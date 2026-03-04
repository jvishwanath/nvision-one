export interface IAIService {
    chat(prompt: string): Promise<string>;
    summarize(text: string): Promise<string>;
}

/** Stub implementation — replace with OpenAI, Gemini, etc. */
export class MockAIService implements IAIService {
    async chat(prompt: string): Promise<string> {
        return `[AI Mock] You asked: "${prompt.slice(0, 60)}…" — connect an LLM provider for real responses.`;
    }

    async summarize(text: string): Promise<string> {
        const words = text.split(/\s+/);
        const preview = words.slice(0, 20).join(" ");
        return `Summary: ${preview}${words.length > 20 ? "…" : ""}`;
    }
}

export const aiService: IAIService = new MockAIService();
