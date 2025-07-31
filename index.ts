import type { Part } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import multer from "multer";
import env from "./config";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const app = express();
const port = env.PORT;

// Define interfaces for request bodies
interface TextRequest {
	text: string;
}

interface FileRequest extends Request {
	file?: Express.Multer.File;
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	fileFilter: (
		_req: Express.Request,
		_file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) => {
		// We'll handle specific file type validation in each route
		cb(null, true);
	},
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});

// Helper function to convert file buffer to base64
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
	return {
		inlineData: {
			data: buffer.toString("base64"),
			mimeType,
		},
	};
}

// Endpoint 1: Generate text from prompt
app.post("/api/generate-text", async (req, res) => {
	try {
		const { text } = req.body;

		// Validate required fields
		if (!text) {
			return res.status(400).json({ error: "Text prompt is required" });
		}

		// Use the text-only model
		const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

		const result = await model.generateContent(text);
		const response = result.response;

		res.json({
			success: true,
			data: response.text(),
			model: env.GEMINI_MODEL,
		});
	} catch (error) {
		console.error("Error generating text:", error);
		res.status(500).json({
			success: false,
			error: "Failed to generate text",
		});
	}
});

// Endpoint 2: Generate content from image and text
app.post(
	"/api/generate-from-image",
	upload.single("image"),
	async (req: FileRequest, res: Response) => {
		try {
			const imageFile = req.file;
			const { text } = req.body as TextRequest;

			// Validate required fields
			if (!text) {
				return res.status(400).json({ error: "Text prompt is required" });
			}

			if (!imageFile) {
				return res.status(400).json({ error: "Image file is required" });
			}

			// Validate image type
			const allowedImageTypes = [
				"image/jpeg",
				"image/png",
				"image/webp",
				"image/heic",
				"image/heif",
			];
			if (!allowedImageTypes.includes(imageFile.mimetype)) {
				return res.status(400).json({
					error:
						"Invalid image format. Supported formats: JPEG, PNG, WEBP, HEIC, HEIF",
				});
			}

			// Use the multimodal model
			const model = genAI.getGenerativeModel({
				model: env.GEMINI_VISION_MODEL,
			});

			const imagePart = fileToGenerativePart(
				imageFile.buffer,
				imageFile.mimetype,
			);

			const result = await model.generateContent([text, imagePart]);
			const response = await result.response;

			res.json({
				success: true,
				data: response.text(),
				model: env.GEMINI_VISION_MODEL,
			});
		} catch (error) {
			console.error("Error generating from image:", error);
			res.status(500).json({
				success: false,
				error: "Failed to generate content from image",
			});
		}
	},
);

// Endpoint 3: Generate from document and text
app.post(
	"/api/generate-from-document",
	upload.single("document"),
	async (req: FileRequest, res: Response) => {
		try {
			const documentFile = req.file;
			const { text } = req.body as TextRequest;

			// Validate required fields
			if (!text) {
				return res.status(400).json({ error: "Text prompt is required" });
			}

			if (!documentFile) {
				return res.status(400).json({ error: "Document file is required" });
			}

			// Validate document type
			const allowedDocumentTypes = [
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
				"text/plain",
				"text/markdown",
			];

			if (!allowedDocumentTypes.includes(documentFile.mimetype)) {
				return res.status(400).json({
					error:
						"Invalid document format. Supported formats: PDF, DOC, DOCX, TXT, MD",
				});
			}

			const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

			const documentPrompt = `Document name: ${documentFile.originalname}
Document type: ${documentFile.mimetype}
User prompt: ${text}

Process this document according to the user's request.`;

			const result = await model.generateContent(documentPrompt);
			const response = result.response;

			res.json({
				success: true,
				data: response.text(),
				model: env.GEMINI_MODEL,
			});
		} catch (error) {
			console.error("Error generating from document:", error);
			res.status(500).json({
				success: false,
				error: "Failed to generate content from document",
			});
		}
	},
);

// Endpoint 4: Generate from audio and text
app.post(
	"/api/generate-from-audio",
	upload.single("audio"),
	async (req: FileRequest, res: Response) => {
		try {
			const audioFile = req.file;
			const { text } = req.body as TextRequest;

			// Validate required fields
			if (!text) {
				return res.status(400).json({ error: "Text prompt is required" });
			}

			if (!audioFile) {
				return res.status(400).json({ error: "Audio file is required" });
			}

			// Validate audio type
			const allowedAudioTypes = [
				"audio/mpeg", // mp3
				"audio/mp4",
				"audio/wav",
				"audio/ogg",
				"audio/webm",
			];

			if (!allowedAudioTypes.includes(audioFile.mimetype)) {
				return res.status(400).json({
					error:
						"Invalid audio format. Supported formats: MP3, MP4, WAV, OGG, WEBM",
				});
			}

			const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

			const audioPrompt = `Audio file name: ${audioFile.originalname}
Audio type: ${audioFile.mimetype}
File size: ${audioFile.size} bytes
User prompt: ${text}

Process this audio according to the user's request.`;

			const result = await model.generateContent(audioPrompt);
			const response = result.response;

			res.json({
				success: true,
				data: response.text(),
				model: env.GEMINI_MODEL,
			});
		} catch (error) {
			console.error("Error generating from audio:", error);
			res.status(500).json({
				success: false,
				error: "Failed to generate content from audio",
			});
		}
	},
);

// Start the server
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
