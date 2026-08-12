import { describe, expect, it } from 'vitest';
import { collaborators, getPublishableCollaborator } from '@/content/collaborators';
import { results } from '@/content/results';
import { company, consent, event, isPending, numbers, history } from '@/content/site-content';
import { ROLE_IDS } from '@/content/types';
import { shuffleForDisplay } from '@/lib/quiz-session';

describe('conteúdo institucional', () => {
  it('mantém o endereço oficial exatamente como fornecido', () => {
    expect(company.address.full).toBe(
      'Rod. Carlos João Strass, 780 — Jardim Tropical, Londrina — PR',
    );
  });

  it('gera um link de mapa apontando para o endereço oficial', () => {
    expect(company.address.mapUrl).toContain('google.com/maps');
    expect(decodeURIComponent(company.address.mapUrl)).toContain('Carlos João Strass, 780');
  });

  it('usa o código de evento correto para deduplicação', () => {
    expect(event.code).toBe('unopar-2026-08-13');
  });

  it('tem cinco marcos na linha do tempo e cinco números', () => {
    expect(history.timeline).toHaveLength(5);
    expect(numbers).toHaveLength(5);
  });

  it('versiona o texto de consentimento', () => {
    expect(consent.version).toMatch(/^v\d+/);
    expect(consent.registration.length).toBeGreaterThan(80);
    expect(consent.raffle.length).toBeGreaterThan(40);
  });

  it('não menciona mais a Lumen Pack', () => {
    const allContent = JSON.stringify({ company, history, numbers });
    expect(allContent).not.toMatch(/lumen/i);
    expect(company.group).toEqual(['Nicopel Embalagens', 'Nicobox', 'Nicocup']);
  });
});

describe('marcadores de conteúdo pendente', () => {
  it('reconhece valores entre colchetes como pendentes', () => {
    expect(isPending('[URL_DO_BANCO_DE_TALENTOS]')).toBe(true);
    expect(isPending('https://nicopel.com.br')).toBe(false);
  });
});

describe('colaboradores', () => {
  it('nenhum card incompleto é publicável', () => {
    for (const person of Object.values(collaborators)) {
      if (person.status !== 'confirmed' || !person.role || !person.quote) {
        expect(getPublishableCollaborator(person.id)).toBeNull();
      }
    }
  });

  it('id inexistente ou nulo não quebra', () => {
    expect(getPublishableCollaborator(null)).toBeNull();
    expect(getPublishableCollaborator('nao-existe')).toBeNull();
  });

  it('colaborador pendente nunca tem cargo preenchido', () => {
    // O cargo é o campo que se é tentado a deduzir. Depoimento pendente pode
    // existir (a pessoa já contou a história); o cargo, não — ou veio do RH,
    // ou fica nulo e o card cai no placeholder.
    for (const person of Object.values(collaborators)) {
      if (person.status === 'pending') {
        expect(person.role, `${person.id} pendente com cargo preenchido`).toBeNull();
        expect(getPublishableCollaborator(person.id)).toBeNull();
      }
    }
  });

  it('todo colaborador publicado tem cargo, depoimento e texto alternativo', () => {
    for (const person of Object.values(collaborators)) {
      if (person.status !== 'confirmed') continue;
      expect(person.role?.length ?? 0, `${person.id} sem cargo`).toBeGreaterThan(3);
      expect(person.quote?.length ?? 0, `${person.id} sem depoimento`).toBeGreaterThan(60);
      expect(person.photoAlt?.length ?? 0, `${person.id} sem alt`).toBeGreaterThan(10);
      expect(getPublishableCollaborator(person.id)).not.toBeNull();
    }
  });

  it('nenhum resultado aponta para um colaborador não publicável', () => {
    // Evita o caso silencioso: vínculo criado no resultado, mas a pessoa
    // ainda pendente — o card cairia no placeholder sem ninguém perceber.
    for (const roleId of ROLE_IDS) {
      const result = results[roleId];
      if (result.contentStatus !== 'confirmed') continue;
      expect(
        getPublishableCollaborator(result.collaboratorId),
        `${roleId} marcado como confirmado mas sem colaborador publicável`,
      ).not.toBeNull();
    }
  });

  it('todo collaboratorId referenciado nos resultados existe', () => {
    for (const roleId of ROLE_IDS) {
      const id = results[roleId].collaboratorId;
      if (id) expect(collaborators[id]).toBeDefined();
    }
  });
});

describe('embaralhamento visual das alternativas', () => {
  const options = ['a', 'b', 'c', 'd', 'e'];

  it('preserva todas as alternativas', () => {
    const shuffled = shuffleForDisplay(options, 12345, 'q1');
    expect([...shuffled].sort()).toEqual([...options].sort());
  });

  it('é estável para a mesma semente e pergunta — voltar não reorganiza a tela', () => {
    expect(shuffleForDisplay(options, 999, 'q3')).toEqual(shuffleForDisplay(options, 999, 'q3'));
  });

  it('varia entre perguntas e entre sessões', () => {
    const sameSeed = new Set(
      ['q1', 'q2', 'q3', 'q4', 'q5'].map((key) => shuffleForDisplay(options, 42, key).join('')),
    );
    expect(sameSeed.size).toBeGreaterThan(1);

    const sameQuestion = new Set(
      [1, 2, 3, 4, 5, 6].map((seed) => shuffleForDisplay(options, seed, 'q1').join('')),
    );
    expect(sameQuestion.size).toBeGreaterThan(1);
  });

  it('não perde itens em listas de 2 e 3 alternativas', () => {
    expect(shuffleForDisplay(['a', 'b'], 7, 'q9').sort()).toEqual(['a', 'b']);
    expect(shuffleForDisplay(['a', 'b', 'c'], 7, 'q9').sort()).toEqual(['a', 'b', 'c']);
  });
});
