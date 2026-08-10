import type { AnswerMap } from './scoring';

/**
 * Persistência do progresso do quiz, modelada como um store externo.
 *
 * Guarda apenas dados NÃO sensíveis (respostas do quiz e etapa atual) e apenas
 * em `sessionStorage` — some ao fechar a aba. Dados pessoais do sorteio nunca
 * passam por aqui, nem por `localStorage`.
 *
 * Por que um store externo e não `useState` + `useEffect`: os componentes leem
 * com `useSyncExternalStore`, que usa o snapshot do servidor durante a
 * hidratação e só então troca pelo valor real do navegador. Isso elimina o
 * descompasso de hidratação sem precisar de efeito nenhum.
 *
 * O estado em memória é a fonte da verdade e o `sessionStorage` é só o espelho
 * persistente: em aba anônima, ou com storage cheio, o quiz continua inteiro.
 */

const STORAGE_KEY = 'nicopel-quiz-v1';
const RESULT_KEY = 'nicopel-result-v1';
const VERSION = 1;

export interface QuizSessionState {
  v: number;
  /** Semente do embaralhamento visual, estável durante a sessão. */
  seed: number;
  answers: AnswerMap;
  /** Índice da pergunta atual, de 0 a 9. */
  step: number;
}

export interface ResultSnapshot {
  role: string;
  group: string;
  secondaryGroup: string;
}

// --- Infraestrutura do store -------------------------------------------------

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function readRaw(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // Modo privado ou storage cheio: seguimos apenas com o estado em memória.
  }
}

/** `subscribe` precisa ser estável entre renders. */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Outra aba pode limpar o progresso; refletimos isso aqui.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export const subscribeToQuizStore = subscribe;

// --- Sessão do quiz ----------------------------------------------------------

function parseSession(raw: string | null): QuizSessionState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const candidate = parsed as Partial<QuizSessionState>;
    if (candidate.v !== VERSION) return null;
    if (typeof candidate.answers !== 'object' || candidate.answers === null) return null;

    return {
      v: VERSION,
      seed: Number.isFinite(candidate.seed) ? (candidate.seed as number) : 1,
      answers: candidate.answers,
      step: Math.max(0, Math.min(9, Math.trunc(candidate.step ?? 0) || 0)),
    };
  } catch {
    return null;
  }
}

/** `undefined` significa “ainda não li o storage nesta aba”. */
let sessionState: QuizSessionState | null | undefined;

export function createSession(): QuizSessionState {
  return {
    v: VERSION,
    seed: Math.floor(Math.random() * 2 ** 31),
    answers: {},
    step: 0,
  };
}

/** Snapshot estável: só muda quando `saveSession`/`clearSession` são chamados. */
export function getSessionSnapshot(): QuizSessionState | null {
  if (sessionState === undefined) sessionState = parseSession(readRaw(STORAGE_KEY));
  return sessionState;
}

/** Durante a renderização no servidor não existe sessão. */
export function getSessionServerSnapshot(): QuizSessionState | null {
  return null;
}

export function saveSession(state: QuizSessionState): void {
  sessionState = state;
  writeRaw(STORAGE_KEY, JSON.stringify(state));
  emit();
}

export function clearSession(): void {
  sessionState = null;
  writeRaw(STORAGE_KEY, null);
  emit();
}

// --- Resultado calculado -----------------------------------------------------

function parseResult(raw: string | null): ResultSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ResultSnapshot>;
    if (!parsed.role || !parsed.group || !parsed.secondaryGroup) return null;
    return {
      role: parsed.role,
      group: parsed.group,
      secondaryGroup: parsed.secondaryGroup,
    };
  } catch {
    return null;
  }
}

let resultState: ResultSnapshot | null | undefined;

/**
 * Guarda o resultado para a página `/resultado/[cargo]` poder mostrar a área
 * secundária. Não vai na URL: um link compartilhado exibe só o cargo.
 */
export function saveResultSnapshot(snapshot: ResultSnapshot): void {
  resultState = snapshot;
  writeRaw(RESULT_KEY, JSON.stringify(snapshot));
  emit();
}

export function getResultSnapshot(): ResultSnapshot | null {
  if (resultState === undefined) resultState = parseResult(readRaw(RESULT_KEY));
  return resultState;
}

export function getResultServerSnapshot(): ResultSnapshot | null {
  return null;
}

export function clearResultSnapshot(): void {
  resultState = null;
  writeRaw(RESULT_KEY, null);
  emit();
}

/** Somente para testes: descarta o estado em memória. */
export function resetStoreForTests(): void {
  sessionState = undefined;
  resultState = undefined;
  listeners.clear();
}

// --- Embaralhamento visual determinístico ------------------------------------

/** PRNG pequeno e rápido (mulberry32), suficiente para ordenar alternativas. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Embaralha a ordem de exibição preservando o mapeamento de cada alternativa.
 * O resultado é estável para a mesma semente e pergunta, então voltar uma tela
 * não reorganiza as opções na frente da pessoa.
 */
export function shuffleForDisplay<T>(items: readonly T[], seed: number, key: string): T[] {
  const random = mulberry32((seed ^ hashString(key)) >>> 0);
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = output[i] as T;
    const b = output[j] as T;
    output[i] = b;
    output[j] = a;
  }
  return output;
}
