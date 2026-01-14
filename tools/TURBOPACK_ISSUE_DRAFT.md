Title: Turbopack panic on Windows — "Next.js package not found" when emitting app endpoint /page

Repository: vercel/next.js (Turbopack)

Short description
- While running Next.js dev on Windows (Next 16.1.1 / Turbopack), the dev server repeatedly panics with "Next.js package not found" during Turbopack asset emission for the app endpoint `/page`. The panic log is written to a Windows temp file (see path below).

Reproduction (minimal)
1. Clone this project: https://github.com/Nlewi-glitch089/halo-social
2. Ensure `node` and `npm` are installed on Windows.
3. Set up env (example DATABASE_URL used in my run):
   - `DATABASE_URL=postgresql://...` (not strictly required but used in my repro)
4. Install: `npm install`
5. Run dev: `npm run dev`
6. Open `http://localhost:3000` and exercise pages; the server prints a panic message and writes a panic log.

Observed
- Dev server prints repeated panic notices and a panic log is created at:
  `C:\Users\<USER>\AppData\Local\Temp\next-panic-*.log`
- Panic message excerpt:
```
Failed to write app endpoint /page
Caused by:
- Next.js package not found
```

Notes / environment
- OS: Windows (user reported Windows 10/11)
- Next.js: 16.1.1
- Node: tested on Node v22.x
- Project contains dynamic server imports and a runtime `lib/prismaClient.mjs` that tries to construct Prisma with a Neon adapter — the panic appears independent of whether Prisma constructs successfully (error originates in Turbopack's emission of the app endpoint).
- I reproduced consistently on my machine; switching dev to `next dev --turbo=false` (disable Turbopack) avoids the panic.

Attachments
- Please see attached panic log from `C:\Users\<USER>\AppData\Local\Temp\next-panic-*.log` (I can paste the full log if helpful).

Suggested debug hints
- The panic stack shows failures in Turbopack's app endpoint emission pipeline (AppEndpoint::app_page_entry → get_next_server_import_map). Node's `require.resolve('next')` resolves to `node_modules/next/dist/server/next.js` in the project, so this looks like an internal Turbopack import-map / asset emission bug rather than a missing dependency.
- Reproducible on Windows; appears stable when Turbopack disabled.

Please let me know if you want a small repro repository or a recording of the startup logs; I can attach the panic log and the minimal repro steps.
