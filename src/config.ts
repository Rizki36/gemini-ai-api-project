import { config } from "dotenv";
import { cleanEnv, port, str } from "envalid";

// Load environment variables from .env file
config();

// Validate environment variables
export const env = cleanEnv(process.env, {
	// Required variables
	GEMINI_API_KEY: str({
		desc: "Google Gemini API key",
	}),

	// Optional variables with defaults
	GEMINI_MODEL: str({
		desc: "Gemini model for text generation",
		default: "gemini-2.0-flash",
	}),
	GEMINI_VISION_MODEL: str({
		desc: "Gemini model for image processing",
		default: "gemini-2.5-pro",
	}),
	PORT: port({
		desc: "Port number for the server",
		default: 3000,
		example: "3000",
	}),
});

export default env;
