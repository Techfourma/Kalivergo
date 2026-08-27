import fs from "node:fs/promises";
import path from "node:path";
import { AIAssistantConfig } from "./config";

export interface KnowledgeFile {
  name: string;
  path: string;
  category: string;
  content: string;
}

export interface Source {
  title: string;
  path: string;
  category?: string;
}

export interface RetrievedKnowledge {
  context: string;
  sources: Source[];
}

const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"]);
const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".git", ".next"]);

/** Low-value words (Indonesian/English) that carry no retrieval signal. */
const STOPWORDS = new Set<string>([
  "yang", "dan", "di", "ke", "dari", "untuk", "pada", "dengan", "atau", "ini",
  "itu", "akan", "tidak", "tak", "bisa", "dapat", "saya", "anda", "kami",
  "kita", "mereka", "adalah", "apakah", "bagaimana", "kapan", "dimana",
  "mengapa", "apa", "siapa", "sesuai", "per", "karena", "agar", "supaya",
  "sebagai", "secara", "tersebut", "beserta", "oleh", "juga", "sudah",
  "belum", "harus", "wajib", "boleh", "mohon", "silakan", "tolong", "harap",
  "melalui", "antara", "sejak", "setiap", "bila", "jika", "kalau", "maka",
  "sehingga", "namun", "tetapi", "sedangkan", "kecuali", "selain",
  "mengingat", "berdasarkan", "adapun", "para", "sebuah", "beberapa",
  "semua", "masing", "misalnya", "contoh", "yaitu", "yakni", "saat",
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "this",
  "that", "it", "these", "those", "do", "does", "did", "can", "could",
  "should", "would", "will", "shall", "may", "might", "must", "not", "no",
  "yes", "what", "which", "who", "when", "where", "why", "how", "your",
  "you", "i", "we", "they", "he", "she", "me", "us", "them", "my", "our",
  "their", "his", "her", "as", "but", "if", "then", "than", "so", "also",
  "etc", "please", "about", "more", "most", "every", "each", "some", "any",
  "such", "only", "just", "very", "its", "within", "into", "upon", "down",
  "up", "out", "over", "under", "again", "once", "here", "there",
]);

let knowledgeIndex: KnowledgeFile[] = [];
let isLoaded = false;
let currentVersion = 0;
let loadPromise: Promise<void> | null = null;
/** Absolute path of the internal dataset folder. */
function getDatasetDirectory(): string {
  const dir = AIAssistantConfig.knowledgeBaseDir;
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
}

async function collectDirectory(
  dir: string,
  baseDir: string,
  out: KnowledgeFile[]
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    const rel = path.relative(baseDir, full).split(path.sep).join("/");

    if (entry.isDirectory()) {
      await collectDirectory(full, baseDir, out);
    } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const content = await fs.readFile(full, "utf-8").catch(() => "");
      if (content.trim().length === 0) continue;
      out.push({
        name: entry.name,
        path: rel,
        category: rel.split("/").slice(0, -1).join("/") || "root",
        content,
      });
    }
  }
}

/**
 * Load (or refresh) the internal knowledge. The result is memoized; pass
 * `force: true` to rebuild the index.
 */
export async function loadKnowledgeBase(force: boolean = false): Promise<KnowledgeFile[]> {
  if (loadPromise) return loadPromise.then(() => [...knowledgeIndex]);
  if (isLoaded && !force) return [...knowledgeIndex];

  loadPromise = (async () => {
    const baseDir = getDatasetDirectory();
    const collected: KnowledgeFile[] = [];
    try {
      await fs.access(baseDir);
      await collectDirectory(baseDir, baseDir, collected);
    } catch {
    }
    knowledgeIndex = collected;
    currentVersion += 1;
    isLoaded = true;
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }

  return [...knowledgeIndex];
}

export function isKnowledgeLoaded(): boolean {
  return isLoaded;
}

export function getKnowledgeVersion(): number {
  return currentVersion;
}

export function getKnowledgeFiles(): KnowledgeFile[] {
  return [...knowledgeIndex];
}

/** Reset module state (used by tests). */
export function resetKnowledgeBase(): void {
  knowledgeIndex = [];
  isLoaded = false;
  currentVersion = 0;
  loadPromise = null;
}

/** Split text into normalized, meaningful tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function containsToken(tokens: string[], queryToken: string): boolean {
  return tokens.some((t) => t === queryToken || t.startsWith(queryToken));
}

/**
 * Retrieve the most relevant excerpts for a query using a deterministic
 * term-overlap score. Returns `null` when nothing matches.
 */
export function retrieveRelevantContext(
  query: string,
  maxFiles: number = 3
): RetrievedKnowledge | null {
  if (!isLoaded || knowledgeIndex.length === 0) return null;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return null;

  const scored = knowledgeIndex
    .map((file) => {
      const bodyTokens = tokenize(file.content);
      const headerTokens = tokenize(`${file.name} ${file.category}`);
      let score = 0;
      let matched = 0;
      for (const qToken of queryTokens) {
        if (containsToken(bodyTokens, qToken)) {
          score += 2;
          matched += 1;
        }
        if (containsToken(headerTokens, qToken)) score += 1;
      }
      return { file, score, matched };
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.matched - a.matched ||
        a.file.path.localeCompare(b.file.path)
    )
    .slice(0, Math.max(1, maxFiles));

  if (scored.length === 0) return null;

  const context = scored
    .map(({ file }) => {
      const body = file.content.trim();
      return `[${file.path}](${file.path})\nKategori: ${file.category}\n${body}`;
    })
    .join("\n\n---\n\n");

  const sources: Source[] = scored.map(({ file }) => ({
    title: file.name,
    path: file.path,
    category: file.category,
  }));

  return { context, sources };
}