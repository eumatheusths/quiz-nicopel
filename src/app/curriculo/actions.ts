'use server';

import { ROLE_IDS, type RoleId } from '@/content/types';
import { getDb } from '@/lib/db';
import { resumes } from '@/lib/schema';

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
  // Só aceitamos um id conhecido: o valor chega do cliente e não é confiável.
  const rawQuizResult = formData.get('quizResult')?.toString();
  const quizResult =
    rawQuizResult && ROLE_IDS.includes(rawQuizResult as RoleId) ? rawQuizResult : null;

  const file = formData.get('cvFile') as File | null;
  let fileBase64 = null;
  let fileName = null;
  let fileType = null;

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'O arquivo não pode ser maior que 5MB.' };
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
