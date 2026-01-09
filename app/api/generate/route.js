import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req) {
  try {
    const body = await req.json()
    const prompt = body?.prompt
    if (prompt === undefined) return NextResponse.json({ message: 'Missing prompt' }, { status: 400 })
    if (typeof prompt !== 'string') return NextResponse.json({ message: 'Prompt must be a string' }, { status: 400 })
    if (prompt.trim().length === 0) return NextResponse.json({ message: 'Prompt cannot be empty' }, { status: 400 })

    const response = await client.images.generate({ model: 'dall-e-2', prompt, n: 1, size: '512x512' })
    const imageUrl = response?.data?.[0]?.url
    if (!imageUrl) return NextResponse.json({ message: 'No image returned from OpenAI' }, { status: 500 })

    return NextResponse.json({ imageUrl, prompt }, { status: 200 })
  } catch (err) {
    console.error('Generate error', err)
    return NextResponse.json({ message: 'OpenAI API error' }, { status: 500 })
  }
}
