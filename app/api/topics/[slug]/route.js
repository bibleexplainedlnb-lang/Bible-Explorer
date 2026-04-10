import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const topic = await prisma.topic.findUnique({
      where: { slug: params.slug },
      include: {
        questions: {
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('GET /api/topics/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
