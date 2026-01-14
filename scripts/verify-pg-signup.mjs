import fs from 'fs/promises'
async function loadEnv() {
  try {
    const src = await fs.readFile(new URL('../.env', import.meta.url), 'utf8')
    src.split(/\r?\n/).forEach(line => {
      const l=line.trim(); if(!l||l.startsWith('#')) return; const eq=l.indexOf('='); if(eq===-1) return; const k=l.slice(0,eq).trim(); let v=l.slice(eq+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))){v=v.slice(1,-1)} if(!(k in process.env)) process.env[k]=v
    })
    console.log('.env loaded')
  } catch (e) {
    console.warn('No .env loaded')
  }
}

async function main(){
  await loadEnv()
  const { Client } = await import('pg')
  const conn = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  if(!conn){ console.error('No DATABASE_URL'); process.exit(2) }
  const client = new Client({ connectionString: conn })
  await client.connect()
  const unique = Date.now()%100000
  const username = `pg_fallback_${unique}`
  const email = `pg+${unique}@example.com`
  const password = 'TestPass1!'
  try{
    const insertUser = await client.query('INSERT INTO "users" ("name","username","email","password") VALUES ($1,$2,$3,$4) RETURNING "id"', ['Verify', username, email, password])
    const id = insertUser.rows[0].id
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    await client.query('INSERT INTO "tokens" ("token","userId") VALUES ($1,$2)', [token, id])
    console.log('Inserted user id', id, 'token', token)
    // cleanup
    await client.query('DELETE FROM "tokens" WHERE "userId"=$1', [id])
    await client.query('DELETE FROM "users" WHERE "id"=$1', [id])
    console.log('Cleanup done')
    await client.end()
    process.exit(0)
  }catch(e){ console.error('pg signup verify failed', e && e.message ? e.message : e); try{await client.end()}catch(_){} process.exit(1)}
}

main()
