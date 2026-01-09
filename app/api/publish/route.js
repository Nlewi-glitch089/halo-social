import { NextResponse } from 'next/server'


export async function POST(req) {
  try {
    const { getPrisma } = await import('../../../lib/prismaClient.mjs')
    const prisma = await getPrisma()
    const body = await req.json()
    const imageUrl = body?.imageUrl
    const prompt = body?.prompt
    if (!imageUrl) return NextResponse.json({ message: 'Missing imageUrl' }, { status: 400 })
    if (typeof imageUrl !== 'string' || imageUrl.trim().length === 0) return NextResponse.json({ message: 'Invalid imageUrl' }, { status: 400 })
    if (prompt === undefined) return NextResponse.json({ message: 'Missing prompt' }, { status: 400 })
    if (typeof prompt !== 'string') return NextResponse.json({ message: 'Prompt must be a string' }, { status: 400 })

    const created = await prisma.publishedImage.create({ data: { imageUrl, prompt } })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('Publish error', err)
    return NextResponse.json({ message: 'Database error' }, { status: 500 })
  }
}
