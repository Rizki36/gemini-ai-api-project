import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config";
import { fileToGenerativePart } from "../utils";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Handles document-based generation requests
 */
export async function handleGenerateFromDocument(
	req: Request,
	headers: Headers,
) {
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

	// Convert document to buffer and then to base64 for the Gemini API
	const documentBuffer = Buffer.from(await documentFile.arrayBuffer());
	const documentPart = fileToGenerativePart(documentBuffer, documentFile.type);

	// Send both the text prompt and the document content to the model
	const result = await model.generateContent([text, documentPart]);
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
