import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { resumeChunks } from '@/lib/schema';

export async function POST(request: NextRequest) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'Banco de dados indisponível.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { uploadId, chunkIndex, chunkBase64 } = body;

    if (!uploadId || typeof chunkIndex !== 'number' || !chunkBase64) {
      return NextResponse.json({ error: 'Dados do chunk inválidos.' }, { status: 400 });
    }

    // Garante que a tabela temporária exista caso a migração ainda não tenha rodado
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS resume_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        upload_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_base64 TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.insert(resumeChunks).values({
      uploadId,
      chunkIndex,
      chunkBase64,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar chunk de currículo:', error);
    return NextResponse.json({ error: 'Erro ao processar chunk.' }, { status: 500 });
  }
}
