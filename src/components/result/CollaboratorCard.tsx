import { getPublishableCollaborator } from '@/content/collaborators';
import { resultUi } from '@/content/site-content';
import { Icon } from '@/components/ui/Icon';
import { PhotoFrame } from '@/components/ui/PhotoFrame';

/**
 * Card de colaborador real.
 *
 * Só exibe pessoa, cargo, foto e depoimento quando tudo estiver confirmado
 * pela Nicopel. Faltando qualquer peça, mostra o placeholder institucional —
 * nunca um cargo deduzido ou uma história inventada.
 */
export function CollaboratorCard({ collaboratorId }: { collaboratorId: string | null }) {
  const person = getPublishableCollaborator(collaboratorId);

  if (!person) {
    return (
      <section
        aria-labelledby="colaborador-titulo"
        className="rounded-[var(--radius-card)] border-2 border-dashed border-nicopel-gray bg-white p-6"
      >
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-nicopel-gray/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-nicopel-gray-text">
          <Icon name="users" className="h-3.5 w-3.5" />
          {resultUi.collaboratorSeal}
        </span>
        <h2 id="colaborador-titulo" className="mt-3 text-base font-bold">
          {resultUi.collaboratorPlaceholder.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-nicopel-gray-text">
          {resultUi.collaboratorPlaceholder.text}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="colaborador-titulo"
      className="overflow-hidden rounded-[var(--radius-card)] border border-nicopel-gray bg-white shadow-[var(--shadow-soft)]"
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <PhotoFrame
          src={person.photo ?? ''}
          alt={person.photoAlt ?? `${person.name}, ${person.role}, na Nicopel Embalagens.`}
          placeholderLabel="Foto pendente"
          className="aspect-[3/4] w-28 shrink-0 sm:w-32"
        />

        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-nicopel-green-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-nicopel-green-deep">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            {resultUi.collaboratorSeal}
          </span>

          <h2 id="colaborador-titulo" className="mt-3 text-lg font-bold leading-tight">
            {person.name}
          </h2>
          <p className="text-sm font-medium text-nicopel-gray-text">
            {person.role}
            {person.tenure && <span className="text-nicopel-gray-mid"> • {person.tenure}</span>}
          </p>

          <blockquote className="mt-3 border-l-2 border-nicopel-green pl-4 text-sm leading-relaxed text-nicopel-ink">
            {person.quote}
          </blockquote>
        </div>
      </div>
    </section>
  );
}
