import { company, history, numbers, resultUi } from '@/content/site-content';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Bloco “Talentos diferentes constroem a mesma história”, exibido depois do
 * resultado: texto curto, cinco marcos da linha do tempo e cinco números.
 */
export function CompanyStory() {
  return (
    <section aria-labelledby="historia-titulo" className="rounded-[var(--radius-card)] bg-nicopel-black text-white">
      <div className="bg-paper-grid-dark rounded-[var(--radius-card)] p-6 sm:p-8">
        <h2 id="historia-titulo" className="text-xl font-bold text-balance sm:text-2xl">
          {resultUi.historyTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
          {history.shortAfterResult}
        </p>

        <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {history.timeline.map((milestone) => (
            <li
              key={milestone.year}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-nicopel-green/50"
            >
              <span className="block text-lg font-bold text-nicopel-green">{milestone.year}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/70">
                {milestone.text}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {numbers.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 p-4">
              <p className="text-xl font-bold leading-tight sm:text-2xl">
                {item.value}
                {item.unit && <span className="ml-1 text-sm font-semibold text-nicopel-green">{item.unit}</span>}
              </p>
              <p className="mt-1 text-xs leading-snug text-white/60">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <address className="text-sm not-italic leading-relaxed text-white/75">
            <span className="font-semibold text-white">{company.name}</span>
            <br />
            {company.address.line1}
            <br />
            {company.address.line2}
          </address>
          <ButtonLink href={company.address.mapUrl} variant="secondary" size="md">
            {resultUi.openMap}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
