'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { consent, event, landing, raffle, registration } from '@/content/site-content';
import { MAX_AGE, MIN_AGE, registrationSchema } from '@/lib/validation';

/**
 * Cadastro exibido antes das perguntas.
 *
 * Nada aqui é guardado em `localStorage`. O que volta do servidor é apenas o
 * `participantId` (um UUID opaco), que fica em `sessionStorage` só para o quiz
 * conseguir anexar o resultado ao cadastro no final.
 */

export interface RegistrationStepProps {
  onRegistered: (participantId: string | null) => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  age?: string;
  form?: string;
}

export function RegistrationStep({ onRegistered }: RegistrationStepProps) {
  const fieldId = useId();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [raffleConsent, setRaffleConsent] = useState(false);
  const [website, setWebsite] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  // Um id por montagem: reenvios do mesmo cadastro são idempotentes.
  const submissionId = useMemo(
    () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-000000000000',
    [],
  );

  function setAgeSafely(next: number) {
    setAge(Math.min(MAX_AGE, Math.max(MIN_AGE, next)));
    setErrors((current) => ({ ...current, age: undefined }));
  }

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (submitting) return;

    const payload = {
      fullName,
      email,
      phone,
      age: age ?? Number.NaN,
      raffleConsent,
      website,
      submissionId,
    };

    const parsed = registrationSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      // Leva o foco para o primeiro campo com problema.
      const first = ['fullName', 'phone', 'email', 'age'].find((key) => key in next);
      if (first) document.getElementById(`${fieldId}-${first}`)?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);
    setFailed(false);

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json().catch(() => ({}))) as {
        participantId?: string;
        errors?: Record<string, string>;
        message?: string;
      };

      if (response.ok && data.participantId) {
        onRegistered(data.participantId);
        return;
      }

      if (response.status === 400 && data.errors) {
        setErrors(data.errors as FormErrors);
        setSubmitting(false);
        return;
      }

      setErrors({ form: data.message ?? registration.errorText });
      setFailed(true);
    } catch {
      // Rede caiu: no estande isso não pode travar a experiência.
      setErrors({ form: registration.errorText });
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border-2 border-nicopel-gray bg-white px-4 py-3 text-base text-nicopel-ink placeholder:text-nicopel-gray-mid focus:border-nicopel-black focus:outline-none';
  const labelClass = 'block text-sm font-semibold text-nicopel-ink';
  const errorClass = 'mt-1.5 text-sm font-medium text-red-700';

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
      <div className="rounded-[var(--radius-card)] border border-nicopel-gray bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-nicopel-green-soft px-3 py-1.5 text-xs font-semibold text-nicopel-green-deep">
          <Icon name="sparkles" className="h-4 w-4" />
          {landing.badge}
        </span>

        <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
          {registration.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-nicopel-gray-text">
          {registration.subtitle}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {/* Honeypot: invisível para pessoas, atraente para robôs. */}
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor={`${fieldId}-website`}>Não preencha este campo</label>
            <input
              id={`${fieldId}-website`}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(changeEvent) => setWebsite(changeEvent.target.value)}
            />
          </div>

          <div>
            <label htmlFor={`${fieldId}-fullName`} className={labelClass}>
              {registration.fields.fullName} <span aria-hidden="true" className="text-red-700">*</span>
            </label>
            <input
              id={`${fieldId}-fullName`}
              type="text"
              autoComplete="name"
              required
              enterKeyHint="next"
              value={fullName}
              onChange={(changeEvent) => setFullName(changeEvent.target.value)}
              aria-invalid={errors.fullName ? 'true' : undefined}
              aria-describedby={errors.fullName ? `${fieldId}-fullName-error` : undefined}
              className={`mt-1.5 ${inputClass} ${errors.fullName ? 'border-red-600' : ''}`}
            />
            {errors.fullName && (
              <p id={`${fieldId}-fullName-error`} className={errorClass}>
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-phone`} className={labelClass}>
                {registration.fields.phone} <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <input
                id={`${fieldId}-phone`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              required
                placeholder="(43) 99999-8888"
                value={phone}
                onChange={(changeEvent) => setPhone(changeEvent.target.value)}
                aria-invalid={errors.phone ? 'true' : undefined}
                aria-describedby={errors.phone ? `${fieldId}-phone-error` : undefined}
                className={`mt-1.5 ${inputClass} ${errors.phone ? 'border-red-600' : ''}`}
              />
              {errors.phone && (
                <p id={`${fieldId}-phone-error`} className={errorClass}>
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${fieldId}-email`} className={labelClass}>
                {registration.fields.email} <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <input
                id={`${fieldId}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
              required
                placeholder="seu@email.com"
                value={email}
                onChange={(changeEvent) => setEmail(changeEvent.target.value)}
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? `${fieldId}-email-error` : undefined}
                className={`mt-1.5 ${inputClass} ${errors.email ? 'border-red-600' : ''}`}
              />
              {errors.email && (
                <p id={`${fieldId}-email-error`} className={errorClass}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* --- Idade: stepper grande + slider, atualizando ao vivo --------- */}
          <div>
            <label htmlFor={`${fieldId}-age`} className={labelClass}>
              {registration.fields.age} <span aria-hidden="true" className="text-red-700">*</span>
            </label>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAgeSafely((age ?? MIN_AGE) - 1)}
                className="tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-nicopel-gray text-xl font-bold text-nicopel-ink hover:border-nicopel-black"
                aria-label="Diminuir idade"
              >
                −
              </button>

              <div className="relative flex-1">
                <input
                  id={`${fieldId}-age`}
                  type="number"
                  inputMode="numeric"
                  required
                  min={MIN_AGE}
                  max={MAX_AGE}
                  placeholder="--"
                  value={age ?? ''}
                  onChange={(changeEvent) => {
                    const raw = changeEvent.target.value;
                    if (raw === '') {
                      setAge(null);
                      return;
                    }
                    const parsedAge = Number.parseInt(raw, 10);
                    if (Number.isFinite(parsedAge)) setAge(parsedAge);
                  }}
                  onBlur={() => {
                    if (age !== null) setAgeSafely(age);
                  }}
                  aria-invalid={errors.age ? 'true' : undefined}
                  aria-describedby={`${fieldId}-age-hint${errors.age ? ` ${fieldId}-age-error` : ''}`}
                  className={`${inputClass} [appearance:textfield] pr-16 text-center text-2xl font-bold tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                    errors.age ? 'border-red-600' : ''
                  }`}
                />
                <span
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-nicopel-gray-mid"
                  aria-hidden="true"
                >
                  {registration.ageHint}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAgeSafely((age ?? MIN_AGE - 1) + 1)}
                className="tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-nicopel-gray text-xl font-bold text-nicopel-ink hover:border-nicopel-black"
                aria-label="Aumentar idade"
              >
                +
              </button>
            </div>

            {/* O slider é um atalho tátil; o campo numérico acima é a fonte da verdade. */}
            <input
              type="range"
              min={MIN_AGE}
              max={MAX_AGE}
              value={age ?? MIN_AGE}
              onChange={(changeEvent) => setAgeSafely(Number(changeEvent.target.value))}
              className="mt-3 w-full accent-nicopel-green-deep"
              aria-label="Ajustar idade com o controle deslizante"
              tabIndex={-1}
            />

            <p id={`${fieldId}-age-hint`} className="mt-1 text-xs text-nicopel-gray-text">
              De {MIN_AGE} a {MAX_AGE} anos.
            </p>
            {errors.age && (
              <p id={`${fieldId}-age-error`} className={errorClass}>
                {errors.age}
              </p>
            )}
          </div>

          {/* --- Sorteio: opt-in opcional e desmarcado ----------------------- */}
          <div className="rounded-[var(--radius-card)] border border-nicopel-green-deep/25 bg-nicopel-green-soft p-4">
            <p className="flex items-start gap-2.5 text-sm font-semibold text-nicopel-ink">
              <Icon name="factory" className="mt-0.5 h-5 w-5 shrink-0 text-nicopel-green-deep" />
              {raffle.banner}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-nicopel-gray-text">{raffle.text}</p>

            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 p-3">
              <input
                type="checkbox"
                checked={raffleConsent}
                onChange={(changeEvent) => setRaffleConsent(changeEvent.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-nicopel-gray-mid accent-nicopel-black"
              />
              <span className="text-sm font-medium leading-snug text-nicopel-ink">
                {raffle.checkbox}
              </span>
            </label>

            <p className="mt-2 text-[11px] leading-relaxed text-nicopel-gray-text">{raffle.note}</p>
          </div>

          <p className="text-[11px] leading-relaxed text-nicopel-gray-text">
            {consent.registration}{' '}
            <Link
              href="/privacidade"
              target="_blank"
              className="font-semibold text-nicopel-ink underline underline-offset-2"
            >
              {registration.privacyLinkLabel}
            </Link>
          </p>

          {errors.form && (
            <p
              role="alert"
              className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900"
            >
              {errors.form}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg" disabled={submitting}>
              {submitting ? registration.submitting : failed ? registration.retry : registration.submit}
            </Button>

            {/* Se o banco falhar, a experiência do estande não pode parar. */}
            {failed && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => onRegistered(null)}
              >
                {registration.continueAnyway}
              </Button>
            )}
          </div>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-nicopel-gray-text">{event.shortLabel}</p>
    </div>
  );
}
