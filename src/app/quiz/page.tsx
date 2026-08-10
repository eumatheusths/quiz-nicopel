import type { Metadata } from 'next';
import { QuizFlow } from '@/components/quiz/QuizFlow';
import { SiteHeader } from '@/components/institutional/SiteHeader';

export const metadata: Metadata = {
  title: 'Quiz de Carreiras',
  description:
    'Responda a 10 perguntas rápidas e descubra qual área da Nicopel combina com o seu perfil.',
  // A jornada em si não precisa ser indexada; a porta de entrada é a home.
  robots: { index: false, follow: true },
};

export default function QuizPage() {
  return (
    <>
      <SiteHeader compact />
      <main id="conteudo" className="min-h-[calc(100dvh-57px)] bg-nicopel-gray/25">
        <QuizFlow />
      </main>
    </>
  );
}
