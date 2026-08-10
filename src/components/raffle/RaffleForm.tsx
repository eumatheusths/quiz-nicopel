'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { consent, event, privacy, raffle } from '@/content/site-content';
import type { GroupId, RoleId } from '@/content/types';
import { raffleInputSchema, type RaffleInput } from '@/lib/validation';

/**
 * Etapa 2 do convite: coleta mínima, mostrada apenas para quem escolheu “Sim”.
 *
 * Nada aqui é gravado em `localStorage` ou `sessionStorage`. Os dados vão
 * direto para o servidor e somem da memória quando o componente desmonta.
 */

export type SubmitOutcome = 'ok' | 'duplicate' | 'error';

export interface RaffleFormProps {
  resultGroup: GroupId;
  resultRole: RoleId;
  onSuccess: (outcome: 'ok' | 'duplicate') => void;
  onFailure: () => void;
  onSkip: () => void;
}

interface ApiResponse {
  ok?: boolean;
  duplicate?: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export function RaffleForm({
  resultGroup,
  resultRole,
  onSuccess,
  onFailure,
  onSkip,
}: RaffleFormProps) {
  const fieldId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  // Um id por montagem do formulário: reenvios do mesmo cadastro são idempotentes.
  const submissionId = useMemo(
    () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-000000000000',
    [],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RaffleInput>({
    resolver: zodResolver(raffleInputSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      course: '',
      institution: event.defaultInstitution,
      resultGroup,
      resultRole,
      // Os dois consentimentos começam desmarcados, sempre.
      raffleConsent: false,
      opportunitiesConsent: false,
      website: '',
      submissionId,
    },
  });

  useEffect(() => {
    if (serverError) {
      // Deixa a mensagem visível para leitores de tela ao aparecer.
      document.getElementById(`${fieldId}-form-error`)?.focus();
    }
  }, [serverError, fieldId]);

  async function onSubmit(values: RaffleInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/raffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      if (response.ok) {
        onSuccess(data.duplicate ? 'duplicate' : 'ok');
        return;
      }

      if (response.status === 400 && data.errors) {
        for (const [field, message] of Object.entries(data.errors)) {
          setError(field as keyof RaffleInput, { type: 'server', message });
        }
        setServerError('Confira os campos destacados e tente de novo.');
        return;
      }

      setServerError(data.message ?? raffle.errorText);
      onFailure();
    } catch {
      // Falha de rede: a participação não foi confirmada, e dizemos isso.
      setServerError(raffle.errorText);
      onFailure();
    }
  }

  const inputClass =
    'w-full rounded-xl border-2 border-nicopel-gray bg-white px-4 py-3 text-base text-nicopel-ink placeholder:text-nicopel-gray-mid focus:border-nicopel-black focus:outline-none';
  const labelClass = 'block text-sm font-semibold text-nicopel-ink';
  const errorClass = 'mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700';

  const contactError = errors.phone?.message ?? errors.email?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <input type="hidden" {...register('resultGroup')} />
      <input type="hidden" {...register('resultRole')} />
      <input type="hidden" {...register('submissionId')} />

      {/* Honeypot: invisível para pessoas, atraente para robôs. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${fieldId}-website`}>Não preencha este campo</label>
        <input
          id={`${fieldId}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      <div>
        <label htmlFor={`${fieldId}-name`} className={labelClass}>
          {raffle.fields.fullName} <span className="text-red-700">*</span>
        </label>
        <input
          id={`${fieldId}-name`}
          type="text"
          autoComplete="name"
          enterKeyHint="next"
          aria-invalid={errors.fullName ? 'true' : undefined}
          aria-describedby={errors.fullName ? `${fieldId}-name-error` : undefined}
          className={`mt-1.5 ${inputClass} ${errors.fullName ? 'border-red-600' : ''}`}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p id={`${fieldId}-name-error`} className={errorClass}>
            {errors.fullName.message}
          </p>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>
          {raffle.fields.contact} <span className="text-red-700">*</span>
        </legend>
        <p className="mt-1 text-xs text-nicopel-gray-text">Preencha pelo menos um dos dois.</p>

        <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldId}-phone`} className="sr-only">
              {raffle.fields.whatsapp}
            </label>
            <input
              id={`${fieldId}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="WhatsApp com DDD"
              aria-invalid={errors.phone ? 'true' : undefined}
              className={`${inputClass} ${errors.phone ? 'border-red-600' : ''}`}
              {...register('phone')}
            />
          </div>
          <div>
            <label htmlFor={`${fieldId}-email`} className="sr-only">
              {raffle.fields.email}
            </label>
            <input
              id={`${fieldId}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              aria-invalid={errors.email ? 'true' : undefined}
              className={`${inputClass} ${errors.email ? 'border-red-600' : ''}`}
              {...register('email')}
            />
          </div>
        </div>

        {contactError && (
          <p className={errorClass} role="alert">
            {contactError}
          </p>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${fieldId}-course`} className={labelClass}>
            {raffle.fields.course}
          </label>
          <input
            id={`${fieldId}-course`}
            type="text"
            className={`mt-1.5 ${inputClass}`}
            {...register('course')}
          />
        </div>
        <div>
          <label htmlFor={`${fieldId}-institution`} className={labelClass}>
            {raffle.fields.institution}
          </label>
          <input
            id={`${fieldId}-institution`}
            type="text"
            className={`mt-1.5 ${inputClass}`}
            {...register('institution')}
          />
        </div>
      </div>

      {/* --- Consentimentos: separados, ambos desmarcados por padrão --- */}
      <div className="space-y-3 rounded-[var(--radius-card)] border border-nicopel-gray bg-nicopel-gray/25 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-nicopel-gray-mid accent-nicopel-black"
            aria-invalid={errors.raffleConsent ? 'true' : undefined}
            {...register('raffleConsent')}
          />
          <span className="text-xs leading-relaxed text-nicopel-ink">
            {consent.raffle} <span className="text-red-700">*</span>
          </span>
        </label>
        {errors.raffleConsent && (
          <p className={errorClass} role="alert">
            {errors.raffleConsent.message}
          </p>
        )}

        <div className="cut-line" />

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-nicopel-gray-mid accent-nicopel-black"
            {...register('opportunitiesConsent')}
          />
          <span className="text-xs leading-relaxed text-nicopel-gray-text">
            {consent.opportunities}
          </span>
        </label>

        <p className="text-[11px] leading-relaxed text-nicopel-gray-text">
          {privacy.optionalNote}{' '}
          <Link
            href="/privacidade"
            target="_blank"
            className="font-semibold text-nicopel-ink underline underline-offset-2"
          >
            {raffle.privacyLinkLabel}
          </Link>
        </p>
      </div>

      {serverError && (
        <p
          id={`${fieldId}-form-error`}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting ? raffle.submitting : raffle.submit}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onSkip}>
          {raffle.skipLink}
        </Button>
      </div>
    </form>
  );
}
