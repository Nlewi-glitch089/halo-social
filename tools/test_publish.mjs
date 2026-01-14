import pkg from 'pg'
const { Client } = pkg
import 'dotenv/config'

async function main(){
  const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
  if(!url){
    console.error('DATABASE_URL not set')
    process.exit(2)
  }
  const client = new Client({ connectionString: url })
  try{
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS published_images (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        prompt TEXT NOT NULL DEFAULT '',
        hearts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const res = await client.query(
      'INSERT INTO published_images (image_url, prompt) VALUES ($1,$2) RETURNING id, image_url AS "imageUrl", prompt, hearts, created_at AS "createdAt"',
      ['/placeholder-test.jpg','test publish']
    )
    console.log('created:', res.rows[0])
    await client.end()
    process.exit(0)
  }catch(err){
    try{ await client.end() }catch(e){}
    console.error('Error:', err.message || err)
    process.exit(3)
  }
}

main()
