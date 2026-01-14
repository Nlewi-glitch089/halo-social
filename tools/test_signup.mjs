import { Client } from 'pg'

async function main() {
  const [,, name, username, email, password] = process.argv
  if (!username || !email || !password) {
    console.error('Usage: node test_signup.mjs <name?> <username> <email> <password>')
    process.exit(2)
  }
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL })
  await client.connect()
  try {
    const emailRes = await client.query('SELECT "id" FROM "users" WHERE "email" = $1 LIMIT 1', [email])
    if (emailRes.rowCount > 0) {
      console.log('Email already exists')
      return
    }
    const userRes = await client.query('SELECT "id" FROM "users" WHERE "username" = $1 LIMIT 1', [username])
    if (userRes.rowCount > 0) {
      console.log('Username already exists')
      return
    }

    const insertUser = await client.query(
      'INSERT INTO "users" ("name","username","email","password") VALUES ($1,$2,$3,$4) RETURNING "id","name","username","email","createdAt"',
      [name || '', username, email, password]
    )
    const createdUser = insertUser.rows[0]
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    await client.query('INSERT INTO "tokens" ("token","userId") VALUES ($1,$2)', [token, createdUser.id])

    console.log('Created user:', createdUser)
    console.log('Created token:', token)
    const users = await client.query('SELECT id, username, email, "createdAt" FROM "users" ORDER BY id')
    const tokens = await client.query('SELECT id, token, "userId", "createdAt" FROM "tokens" ORDER BY id')
    console.log('users:', users.rows)
    console.log('tokens:', tokens.rows)
  } finally {
    await client.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
