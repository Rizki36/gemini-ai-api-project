import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config";
import { fileToGenerativePart } from "../utils";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Handles image-based generation requests
 */
export async function handleGenerateFromImage(req: Request, headers: Headers) {
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
