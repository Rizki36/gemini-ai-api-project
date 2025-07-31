import type { Part } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Serve } from "bun";
import env from "./config";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Define interfaces for request bodies
interface TextRequest {
	text: string;
}

// Helper function to convert file buffer to base64
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
	return {
		inlineData: {
			data: buffer.toString("base64"),
			mimeType,
		},
	};
}

// Create Bun server
const server = Bun.serve({
	port: env.PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// CORS headers
		const headers = new Headers({
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});

		// Handle CORS preflight requests
		if (req.method === "OPTIONS") {
			return new Response(null, { headers });
		}

		// Only handle POST requests
		if (req.method !== "POST") {
			return new Response(JSON.stringify({ error: "Method not allowed" }), {
				status: 405,
				headers: { ...headers, "Content-Type": "application/json" },
			});
		}

		// Route handling
		try {
			if (url.pathname === "/api/generate-text") {
				return await handleGenerateText(req, headers);
			}
			if (url.pathname === "/api/generate-from-image") {
				return await handleGenerateFromImage(req, headers);
			}
			if (url.pathname === "/api/generate-from-document") {
				return await handleGenerateFromDocument(req, headers);
			}
			if (url.pathname === "/api/generate-from-audio") {
				return await handleGenerateFromAudio(req, headers);
			}

			// Return 404 for unknown routes
			return new Response(JSON.stringify({ error: "Route not found" }), {
				status: 404,
				headers: { ...headers, "Content-Type": "application/json" },
			});
		} catch (error) {
			console.error("Error handling request:", error);
			return new Response(
				JSON.stringify({
					success: false,
					error: "Internal server error",
				}),
				{
					status: 500,
					headers: { ...headers, "Content-Type": "application/json" },
				},
			);
		}
	},
});

console.log(`Server is running on port ${server.port}`);

// Handler for generate-text endpoint
async function handleGenerateText(req: Request, headers: Headers) {
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

// Handler for generate-from-image endpoint
async function handleGenerateFromImage(req: Request, headers: Headers) {
	const formData = await req.formData();
	const text = formData.get("text")?.toString();
	const imageFile = formData.get("image") as File | null;

	// Validate required fields
	if (!text) {
		return new Response(JSON.stringify({ error: "Text prompt is required" }), {
			status: 400,
			headers: { ...headers, "Content-Type": "application/json" },
		});
	}

	if (!imageFile) {
		return new Response(JSON.stringify({ error: "Image file is required" }), {
			status: 400,
			headers: { ...headers, "Content-Type": "application/json" },
		});
	}

	// Validate image type
	const allowedImageTypes = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/heic",
		"image/heif",
	];

	if (!allowedImageTypes.includes(imageFile.type)) {
		return new Response(
			JSON.stringify({
				error:
					"Invalid image format. Supported formats: JPEG, PNG, WEBP, HEIC, HEIF",
			}),
			{
				status: 400,
				headers: { ...headers, "Content-Type": "application/json" },
			},
		);
	}

	// Use the multimodal model
	const model = genAI.getGenerativeModel({
		model: env.GEMINI_VISION_MODEL,
	});

	const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
	const imagePart = fileToGenerativePart(imageBuffer, imageFile.type);

	const result = await model.generateContent([text, imagePart]);
	const response = await result.response;

	return new Response(
		JSON.stringify({
			success: true,
			data: response.text(),
			model: env.GEMINI_VISION_MODEL,
		}),
		{
			status: 200,
			headers: { ...headers, "Content-Type": "application/json" },
		},
	);
}

// Handler for generate-from-document endpoint
async function handleGenerateFromDocument(req: Request, headers: Headers) {
	const formData = await req.formData();
	const text = formData.get("text")?.toString();
	const documentFile = formData.get("document") as File | null;

	// Validate required fields
	if (!text) {
		return new Response(JSON.stringify({ error: "Text prompt is required" }), {
			status: 400,
			headers: { ...headers, "Content-Type": "application/json" },
		});
	}

	if (!documentFile) {
		return new Response(
			JSON.stringify({ error: "Document file is required" }),
			{
				status: 400,
				headers: { ...headers, "Content-Type": "application/json" },
			},
		);
	}

	// Validate document type
	const allowedDocumentTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
		"text/plain",
		"text/markdown",
	];

	if (!allowedDocumentTypes.includes(documentFile.type)) {
		return new Response(
			JSON.stringify({
				error:
					"Invalid document format. Supported formats: PDF, DOC, DOCX, TXT, MD",
			}),
			{
				status: 400,
				headers: { ...headers, "Content-Type": "application/json" },
			},
		);
	}

	const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

	const documentPrompt = `
    Document name: ${documentFile.name}
    Document type: ${documentFile.type}
    User prompt: ${text}
    Process this document according to the user's request.`;

	const result = await model.generateContent(documentPrompt);
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

// Handler for generate-from-audio endpoint
async function handleGenerateFromAudio(req: Request, headers: Headers) {
	const formData = await req.formData();
	const text = formData.get("text")?.toString();
	const audioFile = formData.get("audio") as File | null;

	// Validate required fields
	if (!text) {
		return new Response(JSON.stringify({ error: "Text prompt is required" }), {
			status: 400,
			headers: { ...headers, "Content-Type": "application/json" },
		});
	}

	if (!audioFile) {
		return new Response(JSON.stringify({ error: "Audio file is required" }), {
			status: 400,
			headers: { ...headers, "Content-Type": "application/json" },
		});
	}

	// Validate audio type
	const allowedAudioTypes = [
		"audio/mpeg", // mp3
		"audio/mp4",
		"audio/wav",
		"audio/ogg",
		"audio/webm",
	];

	if (!allowedAudioTypes.includes(audioFile.type)) {
		return new Response(
			JSON.stringify({
				error:
					"Invalid audio format. Supported formats: MP3, MP4, WAV, OGG, WEBM",
			}),
			{
				status: 400,
				headers: { ...headers, "Content-Type": "application/json" },
			},
		);
	}

	const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

	const audioPrompt = `
    Audio file name: ${audioFile.name}
    Audio type: ${audioFile.type}
    File size: ${audioFile.size} bytes
    User prompt: ${text}
    Process this audio according to the user's request.`;

	const result = await model.generateContent(audioPrompt);
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
