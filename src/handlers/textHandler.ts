import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config";
import type { TextRequest } from "../types";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Handles text-to-text generation requests
 */
export async function handleGenerateText(req: Request, headers: Headers) {
	const contentType = req.headers.get("Content-Type") || "";

	if (!contentType.includes("application/json")) {
		return new Response(
			JSON.stringify({ error: "Content type must be application/json" }),
			{
				status: 400,
				headers: { ...headers, "Content-Type": "application/json" },
			},
		);
	}

	const body = await req.json();
	const { text } = body as TextRequest;

	// Validate required fields
	if (!text) {
		return new Response(JSON.stringify({ error: "Text prompt is required" }), {
			status: 400,
			headers: { ...headers, "Content-Type": "application/json" },
		});
	}

	// Use the text-only model
	const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

	const result = await model.generateContent(text);
	const response = result.response;

	return new Response(
		JSON.stringify({
			success: true,
			data: response.text(),
			model: env.GEMINI_MODEL,
		}),
		{
			status: 200,
			headers: { ...headers, "Content-Type": "application/json" },
		},
	);
}
