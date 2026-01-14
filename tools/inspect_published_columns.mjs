import pkg from 'pg'
const { Client } = pkg
import 'dotenv/config'

async function main(){
  const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
  if(!url){ console.error('DATABASE_URL not set'); process.exit(2) }
  const c = new Client({ connectionString: url })
  await c.connect()
  const res = await c.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='published_images'")
  console.log(res.rows)
  await c.end()
}
main().catch(e=>{ console.error(e); process.exit(1) })
