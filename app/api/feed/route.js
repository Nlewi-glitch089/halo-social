import { NextResponse } from 'next/server'


export async function GET(req) {
  try {
    const { getPrisma } = await import('../../../lib/prismaClient.mjs')
    const prisma = await getPrisma()
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    let limit = parseInt(url.searchParams.get('limit') || '10', 10)
    if (isNaN(page) || page < 1) return NextResponse.json({ message: 'Invalid page' }, { status: 400 })
    if (isNaN(limit) || limit < 1) return NextResponse.json({ message: 'Invalid limit' }, { status: 400 })
    if (limit > 50) limit = 50

    const skip = (page - 1) * limit
    const [images, total] = await Promise.all([
      prisma.publishedImage.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.publishedImage.count()
    ])
    const totalPages = Math.ceil(total / limit) || 1
    return NextResponse.json({ images, total, page, totalPages }, { status: 200 })
  } catch (err) {
    console.error('Feed GET error', err)
    return NextResponse.json({ message: 'Database error' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const { getPrisma } = await import('../../../lib/prismaClient.mjs')
    const prisma = await getPrisma()
    const body = await req.json()
    const id = body?.id
    const hearts = body?.hearts
    if (id === undefined) return NextResponse.json({ message: 'Missing id' }, { status: 400 })
    if (hearts === undefined) return NextResponse.json({ message: 'Missing hearts' }, { status: 400 })
    if (typeof id !== 'number') return NextResponse.json({ message: 'id must be a number' }, { status: 400 })
    if (typeof hearts !== 'number') return NextResponse.json({ message: 'hearts must be a number' }, { status: 400 })
    if (hearts < 0) return NextResponse.json({ message: 'hearts must be non-negative' }, { status: 400 })

    const existing = await prisma.publishedImage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const updated = await prisma.publishedImage.update({ where: { id }, data: { hearts } })
    return NextResponse.json(updated, { status: 200 })
  } catch (err) {
    console.error('Feed PUT error', err)
    return NextResponse.json({ message: 'Database error' }, { status: 500 })
  }
}
