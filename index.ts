import env from "./src/config";
import { commonResponseHeaders } from "./src/constants";
import { handleGenerateFromAudio } from "./src/handlers/audioHandler";
import { handleGenerateFromDocument } from "./src/handlers/documentHandler";
import { handleGenerateFromImage } from "./src/handlers/imageHandler";
import { handleGenerateText } from "./src/handlers/textHandler";

// Create Bun server
const server = Bun.serve({
	port: env.PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// Create headers with CORS settings
		const headers = new Headers(commonResponseHeaders);

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
