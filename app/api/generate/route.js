import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

async function moderateImageBuffer(buf, mime){
  const hfKey = process.env.HUGGING_FACE_API_KEY
  const modModel = process.env.HF_IMAGE_MOD_MODEL
  if (!hfKey || !modModel) return { ok: true }

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${modModel}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': mime, Accept: 'application/json' },
      body: buf
    })
    const j = await res.json().catch(()=>null)

    // Heuristic: look for common moderation fields indicating unsafe content
    function containsFlag(o){
      if (o == null) return false
      if (typeof o === 'boolean') return o === true
      if (typeof o === 'string') {
        const s = o.toLowerCase()
        return s.includes('nsfw') || s.includes('sexual') || s.includes('violence') || s.includes('racy') || s.includes('adult')
      }
      if (typeof o === 'number') return false
      if (Array.isArray(o)) return o.some(containsFlag)
      if (typeof o === 'object') return Object.values(o).some(containsFlag)
      return false
    }

    const flagged = containsFlag(j)
    return { ok: !flagged, result: j }
  } catch (e) {
    console.warn('Image moderation call failed:', String(e))
    return { ok: true }
  }
}

function ensureUploadsDir(){
  const dir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export async function POST(req){
  try{
    const body = await req.json()
    const { imageBase64, prompt, consent } = body || {}
    if (!imageBase64 || !prompt) return NextResponse.json({ message: 'Missing imageBase64 or prompt' }, { status: 400 })

    // Consent check: require explicit consent for using photos of real people
    if (!consent) return NextResponse.json({ message: 'User consent required to generate images from photos' }, { status: 400 })

    // Rate limiting: simple in-memory per-token/IP windowed limiter
    const RATE_LIMIT = Number(process.env.GENERATE_RATE_LIMIT) || 5 // requests
    const RATE_WINDOW_MS = Number(process.env.GENERATE_RATE_WINDOW_MS) || 60_000 // 1 minute
    const getCookie = (name) => {
      const cookieHeader = req.headers.get('cookie') || ''
      const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))
      return m ? m.split('=')[1] : null
    }
    const token = getCookie('halo_token')
    const clientId = token || (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anon')

    // If a database is configured, use DB-backed rate limiting in `rate_limits`.
    const poolUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    if (poolUrl) {
      try {
        const { Client } = await import('pg')
        const client = new Client({ connectionString: poolUrl })
        await client.connect()
        const nowTs = new Date()
        // read existing row
        const r = await client.query('SELECT id, count, window_start FROM rate_limits WHERE key = $1 LIMIT 1', [clientId])
        if (r.rowCount === 0) {
          // insert new
          await client.query('INSERT INTO rate_limits (key, count, window_start) VALUES ($1, $2, $3)', [clientId, 1, nowTs])
          await client.end()
        } else {
          const row = r.rows[0]
          const windowStart = new Date(row.window_start)
          if (nowTs - windowStart > RATE_WINDOW_MS) {
            // reset window
            await client.query('UPDATE rate_limits SET count = $1, window_start = $2 WHERE id = $3', [1, nowTs, row.id])
          } else {
            const newCount = Number(row.count || 0) + 1
            if (newCount > RATE_LIMIT) {
              await client.end()
              const retryAfter = RATE_WINDOW_MS - (nowTs - windowStart)
              return NextResponse.json({ message: 'Rate limit exceeded', retryAfter }, { status: 429 })
            }
            await client.query('UPDATE rate_limits SET count = $1 WHERE id = $2', [newCount, row.id])
          }
          await client.end()
        }
      } catch (e) {
        // DB rate limiting failed; fall back to in-memory map below
      }
    }
    // Fallback in-memory rate limiter (used only if DB not present or DB operation failed)
    const rateMap = global.__generate_rate_map ||= new Map()
    const now = Date.now()
    const entry = rateMap.get(clientId) || { count: 0, windowStart: now }
    if (now - entry.windowStart > RATE_WINDOW_MS) {
      entry.count = 0
      entry.windowStart = now
    }
    entry.count += 1
    rateMap.set(clientId, entry)
    if (entry.count > RATE_LIMIT) {
      const retryAfter = RATE_WINDOW_MS - (now - entry.windowStart)
      return NextResponse.json({ message: 'Rate limit exceeded', retryAfter }, { status: 429 })
    }

    // parse data URL
    const m = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    let mime = 'image/png'
    let b64 = imageBase64
    if (m){ mime = m[1]; b64 = m[2] }
    const ext = mime.split('/')[1].replace(/[^a-z0-9]/g,'') || 'png'

    const buf = Buffer.from(b64, 'base64')
    const uploads = ensureUploadsDir()
    const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`
    const filepath = path.join(uploads, filename)
    await fs.promises.writeFile(filepath, buf)

    // Prompt moderation: prefer OpenAI moderation API when available
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        const modRes = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ input: prompt })
        })
        const modJson = await modRes.json().catch(()=>null)
        const flagged = modJson?.results?.[0]?.flagged
        if (flagged) return NextResponse.json({ message: 'Prompt violates content policy' }, { status: 403 })
      } catch (err) {
        console.warn('Moderation call failed, proceeding:', String(err))
      }
    }

    // Prefer Hugging Face Inference API when HUGGING_FACE_API_KEY is set.
    const hfKey = process.env.HUGGING_FACE_API_KEY
    if (hfKey) {
      try {
        const model = process.env.HF_MODEL || 'runwayml/stable-diffusion-v1-5'
        const form = new FormData()
        form.append('inputs', prompt)
        const blob = new Blob([buf], { type: mime })
        form.append('image', blob, filename)

        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfKey}` },
          body: form
        })

        // If the model returns an image binary, save it. Otherwise parse JSON for errors.
        const contentType = res.headers.get('content-type') || ''
        if (res.ok && contentType.startsWith('image/')) {
          const ab = await res.arrayBuffer()
          const outBuf = Buffer.from(ab)
          const outExt = contentType.split('/')[1].split(';')[0] || 'png'
          const outName = `generated_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${outExt}`
          const outPath = path.join(uploads, outName)
          await fs.promises.writeFile(outPath, outBuf)
          // run image moderation if configured
          const modRes = await moderateImageBuffer(outBuf, `image/${outExt}`)
          if (!modRes.ok) {
            await fs.promises.unlink(outPath).catch(()=>{})
            return NextResponse.json({ message: 'Generated image failed moderation' }, { status: 403 })
          }
          const url = `/uploads/${outName}`
          return NextResponse.json({ ok: true, imageUrl: url })
        } else {
          const j = await res.json().catch(()=>null)
          console.warn('Hugging Face inference did not return image', j)
        }
      } catch (err) {
        console.warn('Hugging Face call failed', String(err))
      }
    }

    // If HF not used or failed, try OpenAI if key present
    if (openaiKey) {
      try {
        const form = new FormData()
        form.append('prompt', prompt)
        const blob = new Blob([buf], { type: mime })
        form.append('image', blob, filename)

        const res = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}` },
          body: form
        })
        const j = await res.json()
        if (res.ok && j?.data && j.data[0]?.b64_json) {
          const outB64 = j.data[0].b64_json
          const outBuf = Buffer.from(outB64, 'base64')
          const outName = `generated_${Date.now()}_${Math.random().toString(36).slice(2,8)}.png`
          const outPath = path.join(uploads, outName)
          await fs.promises.writeFile(outPath, outBuf)
          // run image moderation if configured
          const modRes = await moderateImageBuffer(outBuf, 'image/png')
          if (!modRes.ok) {
            await fs.promises.unlink(outPath).catch(()=>{})
            return NextResponse.json({ message: 'Generated image failed moderation' }, { status: 403 })
          }
          const url = `/uploads/${outName}`
          return NextResponse.json({ ok: true, imageUrl: url })
        } else {
          console.warn('OpenAI images edit failed', j)
        }
      } catch (err) {
        console.warn('OpenAI call failed', String(err))
      }
    }

    // Fallback: return uploaded file URL
    const url = `/uploads/${filename}`
    return NextResponse.json({ ok: true, imageUrl: url })
  }catch(err){
    console.error('generate error', err)
    return NextResponse.json({ message: String(err) }, { status: 500 })
  }
}
