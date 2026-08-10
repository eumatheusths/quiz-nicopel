'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { login, type ActionState } from './actions';

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="block text-sm font-semibold">
          Senha do painel
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? 'true' : undefined}
          aria-describedby={state.error ? 'admin-password-error' : undefined}
          className="mt-1.5 w-full rounded-xl border-2 border-nicopel-gray px-4 py-3 text-base focus:border-nicopel-black focus:outline-none"
        />
      </div>

      {state.error && (
        <p
          id="admin-password-error"
          role="alert"
          className="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
