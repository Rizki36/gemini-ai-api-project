import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Handles audio-based generation requests
 */
export async function handleGenerateFromAudio(req: Request, headers: Headers) {
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
