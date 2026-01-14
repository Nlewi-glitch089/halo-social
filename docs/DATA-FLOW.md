# Halo Data Flow

1. User enters a `prompt` on the Generate page.
2. Frontend calls `POST /api/generate` with the prompt.
3. Server calls OpenAI DALL·E 2 to generate an image and returns `imageUrl` to client.
4. User clicks Publish; frontend calls `POST /api/publish` with `imageUrl` and `prompt`.
5. Server saves record in `published_images` table via Prisma.
6. Feed page calls `GET /api/feed` for paginated images; server queries Prisma and returns results.
7. Heart clicks call `PUT /api/feed` to update `hearts` count atomically.
