# Halo API

## POST /api/generate
- Description: Generate an image using OpenAI DALL·E 2
- Body: `{ prompt: string }` (required)
- Success: `200` `{ imageUrl, prompt }`
- Errors: `400` (validation), `500` (OpenAI error)

## POST /api/publish
- Description: Save a generated image to the database
- Body: `{ imageUrl: string, prompt: string }` (imageUrl required)
- Success: `201` `{ id, imageUrl, prompt, hearts, createdAt }`
- Errors: `400` (validation), `500` (DB error)

## GET /api/feed
- Description: Retrieve paginated feed
- Query: `page` (default 1), `limit` (default 10, max 50)
- Success: `200` `{ images: [], total, page, totalPages }`
- Errors: `400` (invalid params), `500` (DB error)

## PUT /api/feed
- Description: Update hearts count for an image
- Body: `{ id: number, hearts: number }`
- Success: `200` updated object
- Errors: `400`, `404`, `500`
