'use client';

import { useActionState, useState } from 'react';
import { deleteEntry, type ActionState } from './actions';

const initialState: ActionState = {};

/**
 * Exclusão individual com confirmação em duas etapas — sem `window.confirm`,
 * para funcionar bem em tablet e continuar acessível pelo teclado.
 */
export function DeleteEntryButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, pending] = useActionState(deleteEntry, initialState);
  const [confirming, setConfirming] = useState(false);

  if (state.success) {
    return <span className="text-xs font-medium text-nicopel-gray-mid">Excluída</span>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 underline underline-offset-2 hover:bg-red-50"
      >
        Excluir
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <span className="sr-only">Confirmar exclusão de {name}</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? '...' : 'Confirmar'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-2 py-1.5 text-xs font-medium text-nicopel-gray-text"
      >
        Cancelar
      </button>
      {state.error && (
        <span role="alert" className="text-xs text-red-700">
          {state.error}
        </span>
      )}
    </form>
  );
}
