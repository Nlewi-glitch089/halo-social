import { execSync } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { beforeAll, beforeEach, afterAll } from 'vitest'
import { getPrisma } from '../lib/prismaClient.mjs'

dotenv.config()

const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if (!dbUrl) {
  console.warn('WARNING: TEST_DATABASE_URL or DATABASE_URL not set — DB tests may fail')
}

let createdTempConfig = false
let hadBackup = false
const backupPath = path.resolve(process.cwd(), 'prisma.config.cjs.bak')
const donePath = path.resolve(process.cwd(), 'prisma.dbpush.done')

beforeAll(async () => {
  if (!dbUrl) return

  const cliConfigPath = path.resolve(process.cwd(), 'prisma.config.cjs')

  // Run `prisma db push` only once from worker 1 to avoid races across parallel workers.
  const workerId = process.env.VITEST_WORKER_ID || '1'

  if (workerId !== '1') {
    // wait for worker 1 to finish db push
    const start = Date.now()
    const timeout = 30000
    while (!fs.existsSync(donePath) && Date.now() - start < timeout) {
      // small sleep
      await new Promise((r) => setTimeout(r, 200))
    }
    if (!fs.existsSync(donePath)) {
      console.warn('Timed out waiting for prisma db push to complete in worker 1')
    }
    return
  }

  // Worker 1: back up any existing config and write a CLI-friendly config that reads TEST_DATABASE_URL
  if (fs.existsSync(cliConfigPath)) {
    try {
      fs.copyFileSync(cliConfigPath, backupPath)
      hadBackup = true
    } catch (e) {
      // ignore
    }
  }
  const content = `module.exports = { datasource: { provider: 'postgresql', url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL } }\n`
  try {
    fs.writeFileSync(cliConfigPath, content, 'utf8')
    createdTempConfig = true
  } catch (e) {
    // ignore
  }

  try {
    // Run prisma db push to ensure the schema is applied to the test DB
    execSync('npx prisma db push --schema=prisma/schema.prisma', { stdio: 'inherit', env: { ...process.env, TEST_DATABASE_URL: dbUrl, DATABASE_URL: dbUrl } })
    try { fs.writeFileSync(donePath, 'ok') } catch (e) {}
  } catch (err) {
    console.warn('prisma db push failed in test setup:', err?.message)
  }
})

beforeEach(async () => {
  if (!dbUrl) return
  try {
    const prisma = await getPrisma()
    // clean table between tests
    await prisma.publishedImage.deleteMany()
  } catch (err) {
    // ignore
  }
})

afterAll(async () => {
  try {
    const prisma = await getPrisma()
    if (prisma && prisma.$disconnect) await prisma.$disconnect()
  } catch (err) {}

  // remove temporary cli config if we created it
  const cliConfigPath = path.resolve(process.cwd(), 'prisma.config.cjs')
  if (createdTempConfig) {
    try {
      // restore backup if it existed
      if (hadBackup && fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, cliConfigPath)
        try { fs.unlinkSync(backupPath) } catch (e) {}
      } else {
        try { fs.unlinkSync(cliConfigPath) } catch (e) {}
      }
    } catch (e) {
      // ignore
    }
  }

  try { if (fs.existsSync(donePath)) fs.unlinkSync(donePath) } catch (e) {}
})
