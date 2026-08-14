'use server';

import { eq, asc } from 'drizzle-orm';
import { ROLE_IDS, type RoleId } from '@/content/types';
import { MAX_RESUME_BYTES, MAX_RESUME_LABEL } from '@/lib/validation';
import { getDb } from '@/lib/db';
import { resumes, resumeChunks } from '@/lib/schema';

export interface ResumeActionState {
  error?: string;
  success?: string;
}

export async function submitResume(_prev: ResumeActionState, formData: FormData): Promise<ResumeActionState> {
  const db = getDb();
  if (!db) return { error: 'Banco de dados indisponível.' };

  const fullName = formData.get('fullName')?.toString();
  const email = formData.get('email')?.toString();
  const phone = formData.get('phone')?.toString();
  
  if (!fullName || !email || !phone) {
    return { error: 'Nome, E-mail e Telefone são obrigatórios.' };
  }

  const ageStr = formData.get('age')?.toString();
  const parsedAge = ageStr ? Number.parseInt(ageStr, 10) : Number.NaN;
  const age = Number.isFinite(parsedAge) ? parsedAge : null;
  const address = formData.get('address')?.toString();
  const interests = formData.getAll('interests').map((i) => i.toString());

  // Cargo indicado pelo quiz, quando a pessoa veio pela página de resultado.
  const rawQuizResult = formData.get('quizResult')?.toString();
  const quizResult =
    rawQuizResult && ROLE_IDS.includes(rawQuizResult as RoleId) ? rawQuizResult : null;

  let fileBase64: string | null = null;
  let fileName: string | null = formData.get('fileName')?.toString() || null;
  let fileType: string | null = formData.get('fileType')?.toString() || null;

  const uploadId = formData.get('uploadId')?.toString();
  const file = formData.get('cvFile') as File | null;

  if (uploadId) {
    // Reúne os chunks enviados via API route para contornar limite do Vercel
    try {
      const chunks = await db
        .select()
        .from(resumeChunks)
        .where(eq(resumeChunks.uploadId, uploadId))
        .orderBy(asc(resumeChunks.chunkIndex));

      if (chunks.length > 0) {
        fileBase64 = chunks.map((c) => c.chunkBase64).join('');
        // Limpa os chunks temporários do banco
        await db.delete(resumeChunks).where(eq(resumeChunks.uploadId, uploadId));
      }
    } catch (err) {
      console.error('Erro ao remontar chunks do currículo:', err);
      return { error: 'Erro ao processar o arquivo anexado. Tente novamente.' };
    }
  } else if (file && file.size > 0) {
    if (file.size > MAX_RESUME_BYTES) {
      return { error: `O arquivo não pode ser maior que ${MAX_RESUME_LABEL}.` };
    }
    const buffer = await file.arrayBuffer();
    fileBase64 = Buffer.from(buffer).toString('base64');
    fileName = file.name;
    fileType = file.type;
  }

  try {
    await db.insert(resumes).values({
      fullName,
      email,
      phone,
      age,
      address,
      interests: JSON.stringify(interests),
      quizResult,
      fileName,
      fileType,
      fileBase64,
    });
    return { success: 'Currículo enviado com sucesso! Muito obrigado pelo interesse.' };
  } catch (error) {
    console.error(error);
    return { error: 'Ocorreu um erro ao enviar o currículo. Tente novamente.' };
  }
}
