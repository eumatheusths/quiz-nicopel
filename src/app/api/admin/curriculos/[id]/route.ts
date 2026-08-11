import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { resumes } from '@/lib/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return new NextResponse('Database Error', { status: 500 });
  }

  const { id } = await params;

  try {
    const resume = await db.query.resumes.findFirst({
      where: eq(resumes.id, id),
    });

    if (!resume || !resume.fileBase64) {
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = Buffer.from(resume.fileBase64, 'base64');

    const headers = new Headers();
    if (resume.fileType) {
      headers.set('Content-Type', resume.fileType);
    } else {
      headers.set('Content-Type', 'application/octet-stream');
    }

    const safeName = resume.fileName 
      ? encodeURIComponent(resume.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')) 
      : 'curriculo.pdf';

    headers.set('Content-Disposition', `attachment; filename="${safeName}"`);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading resume:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
