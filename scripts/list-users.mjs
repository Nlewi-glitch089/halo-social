import fs from 'fs/promises'

function parseDotEnv(src) {
  const lines = String(src).split(/\r?\n/)
  for (const line of lines) {
    const l = line.trim()
    if (!l || l.startsWith('#')) continue
    const eq = l.indexOf('=')
    if (eq === -1) continue
    const key = l.slice(0, eq).trim()
    let val = l.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = process.env[key] ?? val
  }
}

async function loadEnv() {
  try {
    const envPath = new URL('../.env', import.meta.url)
    const src = await fs.readFile(envPath, 'utf8')
    parseDotEnv(src)
    console.log('.env loaded')
  } catch (e) {
    console.warn('No .env found; relying on process.env')
  }
}

async function main() {
  await loadEnv()
  const conn = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  if (!conn) {
    console.error('No TEST_DATABASE_URL or DATABASE_URL set')
    process.exit(2)
  }

  let Client
  try {
    const pg = await import('pg')
    Client = pg.Client ?? pg.default?.Client ?? pg.Client
  } catch (e) {
    console.error('pg module not found. Install with `npm install pg`')
    process.exit(3)
  }

  const client = new Client({ connectionString: conn })
  try {
    await client.connect()
    const res = await client.query('SELECT "id","username","email","createdAt" FROM "users" ORDER BY "id" DESC LIMIT 20')
    console.log('Latest users:', res.rows)
    await client.end()
    process.exit(0)
  } catch (e) {
    console.error('DB list error:', e && e.message ? e.message : e)
    try { await client.end() } catch (_) {}
    process.exit(1)
  }
}

main()
