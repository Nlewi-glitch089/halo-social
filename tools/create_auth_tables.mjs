import pkg from 'pg'
const { Client } = pkg

async function main(){
  const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
  if(!url){
    console.error('DATABASE_URL not set')
    process.exit(2)
  }
  const client = new Client({ connectionString: url })
  try{
    await client.connect()
    console.log('Connected to DB host:', new URL(url).host)

    const usersSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);
    `

    const tokensSql = `
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL,
      "userId" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tokens_token_key ON tokens(token);
    `

    const likesSql = `
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "imageId" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS likes_user_image_key ON likes("userId","imageId");
    `

    const friendsSql = `
    CREATE TABLE IF NOT EXISTS friends (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "friendId" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS friends_user_friend_key ON friends("userId","friendId");
    `

    const publishedImagesSql = `
    CREATE TABLE IF NOT EXISTS published_images (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      prompt TEXT NOT NULL DEFAULT '',
      hearts INTEGER NOT NULL DEFAULT 0,
      author_id INTEGER,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    `

    const rateLimitsSql = `
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_idx ON rate_limits(key);
    `

    await client.query('BEGIN')
    await client.query(usersSql)
    await client.query(tokensSql)
    await client.query(likesSql)
    await client.query(friendsSql)
    await client.query(publishedImagesSql)
    await client.query(rateLimitsSql)
    // add FK if not exists (check first)
    const fkCheck = await client.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name='tokens' AND constraint_type='FOREIGN KEY'
    `)
    if(!fkCheck.rows.find(r=>r.constraint_name && r.constraint_name.includes('tokens_userid_fkey') || fkCheck.rows.length===0)){
      try{
        await client.query(`ALTER TABLE tokens ADD CONSTRAINT tokens_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`)
        console.log('Added foreign key tokens->users')
      }catch(e){
        // ignore if can't add
        console.warn('Could not add FK, it may already exist or require manual check:', e.message)
      }
    }
    // ensure published_images has an author_id column and FK -> users(id) if possible
    try{
      await client.query(`ALTER TABLE published_images ADD COLUMN IF NOT EXISTS author_id INTEGER`)
    }catch(e){ /* ignore */ }
    try{
      await client.query('CREATE INDEX IF NOT EXISTS published_images_author_idx ON published_images(author_id)')
    }catch(e){ /* ignore */ }
    try{
      const piFkCheck = await client.query(`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name='published_images' AND constraint_type='FOREIGN KEY'
      `)
      if(!piFkCheck.rows.find(r=>r.constraint_name && r.constraint_name.includes('published_images_author_id_fkey'))){
        try{
          await client.query(`ALTER TABLE published_images ADD CONSTRAINT published_images_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE`)
          console.log('Added foreign key published_images.author_id->users')
        }catch(e){
          // ignore
        }
      }
    }catch(e){ /* ignore */ }
    await client.query('COMMIT')
    console.log('Tables ensured')

    // list rows
    const ures = await client.query('select id, username, email, "createdAt" from users order by id desc limit 20')
    const tres = await client.query('select id, token, "userId", "createdAt" from tokens order by id desc limit 20')
    console.log('users:', ures.rows)
    console.log('tokens:', tres.rows)
    await client.end()
    process.exit(0)
  }catch(err){
    try{ await client.end() }catch(e){}
    console.error('Error:', err.message || err)
    process.exit(3)
  }
}

main()
