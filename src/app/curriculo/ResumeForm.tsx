'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MAX_RESUME_BYTES, MAX_RESUME_LABEL } from '@/lib/validation';
import { submitResume, type ResumeActionState } from './actions';

/**
 * Formulário do banco de talentos.
 *
 * Quando a pessoa chega pela página de resultado, o cargo indicado pelo quiz
 * vem junto e é gravado com o currículo — é o que liga as duas pontas: o RH vê
 * o CV já com a área que combinou com aquela pessoa.
 */

const initialState: ResumeActionState = {};

/** Áreas que a Nicopel usa para triagem. Não são os 16 cargos do quiz. */
export const INTEREST_AREAS = [
  'Produção',
  'Logística',
  'Administrativo',
  'Comercial/Vendas',
  'Manutenção',
  'Jovem Aprendiz',
] as const;

export interface ResumeFormProps {
  /** Nome do cargo indicado pelo quiz, quando a pessoa veio de lá. */
  quizResultName: string | null;
  /** Id do cargo, gravado junto do currículo. */
  quizResultId: string | null;
  /** Área de interesse pré-marcada a partir do resultado do quiz. */
  suggestedArea: string | null;
}

const inputClass =
  'w-full rounded-xl border-2 border-nicopel-gray bg-white px-4 py-3 text-base text-nicopel-ink outline-none transition-colors focus:border-nicopel-black';
const labelClass = 'block text-sm font-semibold text-nicopel-ink';

export function ResumeForm({ quizResultName, quizResultId, suggestedArea }: ResumeFormProps) {
  const [state, formAction, isPending] = useActionState(submitResume, initialState);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Barra o arquivo grande demais no próprio navegador.
   *
   * Não é firula de UX: acima do `bodySizeLimit` a requisição é recusada pelo
   * framework antes de chegar à action, e o retorno é um 500 que derruba a
   * página inteira. A única forma de mostrar uma mensagem decente é não deixar
   * o envio acontecer.
   */
  function checkFile(input: HTMLInputElement | null): boolean {
    const file = input?.files?.[0];
    if (!file || file.size <= MAX_RESUME_BYTES) {
      setFileError(null);
      return true;
    }
    const mb = (file.size / 1024 / 1024).toFixed(1).replace('.', ',');
    setFileError(
      `O arquivo tem ${mb} MB e o limite é ${MAX_RESUME_LABEL}. Envie um PDF mais leve ou deixe sem anexo — só o contato já vale.`,
    );
    return false;
  }

  if (state.success) {
    return (
      <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-8 text-center shadow-[var(--shadow-soft)] sm:p-10">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-nicopel-green-soft text-nicopel-green-deep"
          aria-hidden="true"
        >
          <Icon name="check-badge" className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">Currículo enviado!</h2>
        <p className="mt-3 text-sm leading-relaxed text-nicopel-gray-text" role="status">
          {state.success}
        </p>
        <Link
          href="/"
          className="tap-target mt-7 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-nicopel-black px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-nicopel-ink"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <form
        action={formAction}
        onSubmit={(submitEvent) => {
          if (!checkFile(fileRef.current)) {
            submitEvent.preventDefault();
            fileRef.current?.focus();
          }
        }}
        className="space-y-6"
      >
        {/* Cargo indicado pelo quiz, quando houver. */}
        {quizResultId && <input type="hidden" name="quizResult" value={quizResultId} />}

        {state.error && (
          <p
            role="alert"
            className="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
          >
            {state.error}
          </p>
        )}

        {quizResultName && (
          <p className="flex items-start gap-2.5 rounded-xl border border-nicopel-green-deep/25 bg-nicopel-green-soft p-4 text-sm leading-relaxed">
            <Icon name="sparkles" className="mt-0.5 h-5 w-5 shrink-0 text-nicopel-green-deep" />
            <span>
              Seu resultado no quiz foi{' '}
              <strong className="font-semibold">{quizResultName}</strong>. Vamos enviar isso junto
              com o seu currículo.
            </span>
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className={labelClass}>
              Nome completo <span aria-hidden="true" className="text-red-700">*</span>
            </label>
            <input
              required
              type="text"
              id="fullName"
              name="fullName"
              autoComplete="name"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              WhatsApp <span aria-hidden="true" className="text-red-700">*</span>
            </label>
            <input
              required
              type="tel"
              inputMode="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              placeholder="(43) 99999-8888"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail <span aria-hidden="true" className="text-red-700">*</span>
            </label>
            <input
              required
              type="email"
              inputMode="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="age" className={labelClass}>
              Idade
            </label>
            <input
              type="number"
              inputMode="numeric"
              id="age"
              name="age"
              min={14}
              max={99}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>
              Cidade / bairro
            </label>
            <input
              type="text"
              id="address"
              name="address"
              autoComplete="address-level2"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <fieldset className="border-t border-nicopel-gray pt-5">
          <legend className={labelClass}>Áreas de interesse</legend>
          <p className="mt-1 text-xs text-nicopel-gray-text">
            Pode marcar mais de uma. É só para direcionar a triagem.
          </p>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {INTEREST_AREAS.map((area) => (
              <label
                key={area}
                className="tap-target flex cursor-pointer items-center gap-3 rounded-xl border-2 border-nicopel-gray px-3.5 transition-colors hover:border-nicopel-gray-mid has-[:checked]:border-nicopel-black has-[:checked]:bg-nicopel-green-soft"
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={area}
                  defaultChecked={area === suggestedArea}
                  className="h-5 w-5 shrink-0 rounded border-2 border-nicopel-gray-mid accent-nicopel-black"
                />
                <span className="text-sm font-medium">{area}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="border-t border-nicopel-gray pt-5">
          <label htmlFor="cvFile" className={labelClass}>
            Anexar currículo (opcional)
          </label>
          <p className="mt-1 mb-3 text-xs text-nicopel-gray-text">
            PDF, DOC ou DOCX, até {MAX_RESUME_LABEL}. Sem arquivo, guardamos seu contato do mesmo jeito.
          </p>
          <input
            ref={fileRef}
            type="file"
            id="cvFile"
            name="cvFile"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(changeEvent) => checkFile(changeEvent.currentTarget)}
            aria-invalid={fileError ? 'true' : undefined}
            aria-describedby={fileError ? 'cvFile-error' : undefined}
            className={`w-full cursor-pointer rounded-xl border-2 border-dashed bg-white px-3 py-4 text-sm text-nicopel-gray-text file:mr-4 file:rounded-xl file:border-0 file:bg-nicopel-black file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-nicopel-ink ${
              fileError ? 'border-red-600' : 'border-nicopel-gray'
            }`}
          />

          {fileError && (
            <p
              id="cvFile-error"
              role="alert"
              className="mt-2 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
            >
              {fileError}
            </p>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-nicopel-gray-text">
          Ao enviar, você concorda que a Nicopel use estes dados para avaliar seu perfil em
          processos seletivos.{' '}
          <Link
            href="/privacidade"
            target="_blank"
            className="font-semibold text-nicopel-ink underline underline-offset-2"
          >
            Como seus dados serão usados?
          </Link>
        </p>

        <Button type="submit" variant="inverse" size="lg" className="w-full" disabled={isPending || fileError !== null}>
          {isPending ? 'Enviando...' : 'Enviar currículo'}
        </Button>
      </form>
    </div>
  );
}
