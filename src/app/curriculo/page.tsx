'use client';

import { useActionState, useRef } from 'react';
import { SiteHeader } from '@/components/institutional/SiteHeader';
import { SiteFooter } from '@/components/institutional/SiteFooter';
import { submitResume, type ResumeActionState } from './actions';

const initialState: ResumeActionState = {};

export default function CurriculoPage() {
  const [state, formAction, isPending] = useActionState(submitResume, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.success) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-nicopel-gray/25">
          <div className="bg-white rounded-xl shadow-sm p-10 max-w-lg text-center border border-nicopel-gray">
            <h1 className="text-2xl font-bold text-nicopel-green-deep">Enviado com sucesso!</h1>
            <p className="mt-4 text-nicopel-gray-text">{state.success}</p>
            <a href="/" className="mt-8 inline-block px-6 py-3 bg-nicopel-black text-white rounded-xl font-semibold hover:bg-nicopel-ink transition-colors">
              Voltar ao Início
            </a>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-nicopel-gray/25 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] border border-nicopel-gray p-6 sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Envie seu Currículo</h1>
          <p className="text-nicopel-gray-text text-sm mb-8">
            Preencha rapidamente os dados abaixo. Nome, e-mail e telefone são obrigatórios.
          </p>

          <form ref={formRef} action={formAction} className="space-y-6">
            {state.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {state.error}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-semibold mb-1">Nome completo *</label>
                <input required type="text" id="fullName" name="fullName" className="w-full rounded-xl border-2 border-nicopel-gray px-4 py-2.5 focus:border-nicopel-black outline-none transition-colors" />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1">E-mail *</label>
                <input required type="email" id="email" name="email" className="w-full rounded-xl border-2 border-nicopel-gray px-4 py-2.5 focus:border-nicopel-black outline-none transition-colors" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-1">Telefone / WhatsApp *</label>
                <input required type="tel" id="phone" name="phone" className="w-full rounded-xl border-2 border-nicopel-gray px-4 py-2.5 focus:border-nicopel-black outline-none transition-colors" />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-semibold mb-1">Idade</label>
                <input type="number" id="age" name="age" className="w-full rounded-xl border-2 border-nicopel-gray px-4 py-2.5 focus:border-nicopel-black outline-none transition-colors" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-semibold mb-1">Endereço (Rua, Bairro, Cidade)</label>
                <input type="text" id="address" name="address" className="w-full rounded-xl border-2 border-nicopel-gray px-4 py-2.5 focus:border-nicopel-black outline-none transition-colors" />
              </div>
            </div>

            <fieldset className="pt-4 border-t border-nicopel-gray">
              <legend className="block text-sm font-semibold mb-3">Áreas de Interesse</legend>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Produção', 'Logística', 'Administrativo', 'Comercial/Vendas', 'Manutenção', 'Jovem Aprendiz'].map(area => (
                  <label key={area} className="flex items-center gap-3 p-3 border border-nicopel-gray rounded-xl hover:bg-nicopel-gray/25 cursor-pointer transition-colors">
                    <input type="checkbox" name="interests" value={area} className="w-4 h-4 text-nicopel-black accent-nicopel-black" />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4 border-t border-nicopel-gray">
              <label htmlFor="cvFile" className="block text-sm font-semibold mb-1">Anexar Currículo (Opcional)</label>
              <p className="text-xs text-nicopel-gray-text mb-3">Formatos aceitos: PDF, DOC, DOCX. Tamanho máximo: 5MB.</p>
              <input 
                type="file" 
                id="cvFile" 
                name="cvFile" 
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                className="w-full text-sm text-nicopel-gray-text file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-nicopel-black file:text-white hover:file:bg-nicopel-ink cursor-pointer bg-white border-2 border-nicopel-gray border-dashed rounded-xl py-4 px-2"
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-nicopel-green-deep hover:bg-nicopel-green-deep/90 text-white font-bold py-3.5 px-4 rounded-xl disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Enviando...' : 'Enviar Currículo'}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
