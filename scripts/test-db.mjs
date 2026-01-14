import fs from 'fs/promises'
import getPrisma from '../lib/prismaClient.mjs'

function withTimeout(promise, ms = 8000, label = 'operation') {
  let timer
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => {
      const err = new Error(`Timed out after ${ms}ms: ${label}`)
      err.code = 'ETIMEDOUT'
      rej(err)
    }, ms)
  })
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout])
}

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
    console.warn('No .env found or failed to load; relying on process.env')
  }
}

async function main() {
  await loadEnv()
  let prisma
  try {
    console.log('TEST: calling getPrisma()')
    prisma = await getPrisma()
    console.log('TEST: getPrisma() returned')
  } catch (e) {
    console.error('getPrisma() failed:', e && e.message ? e.message : e)
    console.error(e)
    process.exit(2)
  }

  const unique = Date.now() % 100000
  const data = {
    name: 'Test User',
    username: `test_user_${unique}`,
    email: `test+${unique}@example.com`,
    password: 'TestPass1!'
  }

  try {
    console.log('TEST: calling prisma.$connect()')
    try {
      await withTimeout(prisma.$connect?.(), 8000, '$connect')
      console.log('TEST: prisma.$connect() finished')
    } catch (connErr) {
      console.error('TEST: prisma.$connect() error:', connErr && connErr.message ? connErr.message : connErr)
    }

    console.log('TEST: running test query SELECT 1')
    try {
      const res = await withTimeout(prisma.$queryRaw`SELECT 1`, 8000, '$queryRaw SELECT 1')
      console.log('TEST: SELECT 1 result:', res)
    } catch (qerr) {
      console.error('TEST: SELECT 1 failed or timed out:', qerr && qerr.message ? qerr.message : qerr)
    }

    console.log('TEST: creating user')
    try {
      const created = await withTimeout(prisma.user.create({ data }), 8000, 'user.create')
      console.log('Created user:', created)
    } catch (createErr) {
      console.error('TEST: create user failed or timed out:', createErr && createErr.message ? createErr.message : createErr)
    }

    try { if (prisma?.$disconnect) await withTimeout(prisma.$disconnect(), 4000, '$disconnect') } catch (dErr) { console.warn('Disconnect error:', dErr && dErr.message ? dErr.message : dErr) }
    process.exit(0)
  } catch (e) {
    console.error('Prisma create user error:')
    console.error(e)
    try { if (prisma?.$disconnect) await prisma.$disconnect() } catch (_) {}
    process.exit(1)
  }
}

main()
