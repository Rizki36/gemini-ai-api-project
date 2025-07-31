# Gemini AI API Project

This project provides a set of API endpoints that utilize Google's Gemini AI models to generate content from various input types.

## Prerequisites

- Node.js and Bun installed
- Google Gemini API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```
3. Set your environment variables:
   ```
   export GEMINI_API_KEY='your-api-key'
   export GEMINI_MODEL='gemini-pro'  # Optional, defaults to gemini-pro
   export GEMINI_VISION_MODEL='gemini-pro-vision'  # Optional, defaults to gemini-pro-vision
   ```

## Running the Server

Start the server with:

```
bun run index.ts
```

The server will run on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Linting with Biome

The project uses Biome for linting and formatting. Run the following commands:

```
# Check code for linting issues
bun run lint

# Fix linting issues automatically
bun run lint:fix
```

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) | none |
| `GEMINI_MODEL` | The Gemini model to use for text generation | gemini-2.0-flash |
| `GEMINI_VISION_MODEL` | The Gemini model to use for image processing | gemini-2.5-pro |
| `PORT` | The port number for the server | 3000 |

## API Endpoints

### 1. Generate Text

Generates text content based on a text prompt.

- **URL**: `/api/generate-text`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "text": "Your prompt here"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": "Generated text response",
    "model": "gemini-pro"
  }
  ```

### 2. Generate from Image

Generates content based on an image and a text prompt.

- **URL**: `/api/generate-from-image`
- **Method**: `POST`
- **Body**: `multipart/form-data`
  - `image`: Image file (JPEG, PNG, WEBP, HEIC, HEIF)
  - `text`: Your prompt
- **Response**:
  ```json
  {
    "success": true,
    "data": "Generated text response",
    "model": "gemini-pro-vision"
  }
  ```

### 3. Generate from Document

Generates content based on a document and a text prompt.

- **URL**: `/api/generate-from-document`
- **Method**: `POST`
- **Body**: `multipart/form-data`
  - `document`: Document file (PDF, DOC, DOCX, TXT, MD)
  - `text`: Your prompt
- **Response**:
  ```json
  {
    "success": true,
    "data": "Generated text response",
    "model": "gemini-pro"
  }
  ```

### 4. Generate from Audio

Generates content based on an audio file and a text prompt.

- **URL**: `/api/generate-from-audio`
- **Method**: `POST`
- **Body**: `multipart/form-data`
  - `audio`: Audio file (MP3, MP4, WAV, OGG, WEBM)
  - `text`: Your prompt
- **Response**:
  ```json
  {
    "success": true,
    "data": "Generated text response",
    "model": "gemini-pro"
  }
  ```

## Error Handling

All endpoints validate required inputs and file types. If validation fails, a 400 response is returned with an error message.

If the Gemini API encounters an error, a 500 response is returned.

## File Size Limits

There is a 10MB limit on all file uploads.
