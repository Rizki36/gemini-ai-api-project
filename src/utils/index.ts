import type { Part } from "@google/generative-ai";

/**
 * Converts a file buffer to a GenerativeAI Part object with base64 encoding
 */
export function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
	return {
		inlineData: {
			data: buffer.toString("base64"),
			mimeType,
		},
	};
}
