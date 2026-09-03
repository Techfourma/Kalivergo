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

interface IndexedFile {
  name: string;
  path: string;
  category: string;
  content: string;
  bodyTokens: string[];
  headerTokens: string[];
  tokenSet: Set<string>;
}

interface InvertedIndexEntry {
  fileIndex: number;
  bodyScore: number;
  headerScore: number;
}

const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"]);
const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".git", ".next"]);

/**
 * Indonesian affixes used for a conservative "lite stemmer". The stemmer is
 * only applied to make retrieval morphology-robust (e.g. `mendaftar`,
 * `pendaftaran` and `daftar` collapse to the same stem). It is NOT used for
 * answer fidelity — the original document text is still what is sent to the
 * LLM as context.
 *
 * Rules are deliberately conservative:
 * - remove at most ONE suffix and ONE prefix,
 * - never leave a stem shorter than 4 characters,
 * - any token shorter than 4 characters is left untouched.
 */
const STEM_SUFFIXES = ["nya", "kah", "lah", "pun", "kan", "i", "an"];
const STEM_PREFIXES = [
  "meng", "meny", "mem", "men", "peng", "pen", "pem", "per",
  "ber", "ter", "ke", "se", "di", "me", "pe",
] as const;

/**
 * Query-expansion synonyms for high-value Kalivergo vocabulary. Exact
 * keyword matching alone misses questions that use a different word for the
 * same concept (e.g. "daftar" vs "registrasi"). Expanding the query with
 * these synonyms improves recall; the ranking still keeps precision.
 */
const QUERY_SYNONYMS: Record<string, string[]> = {
  daftar: ["registrasi", "signup", "register"],
  registrasi: ["daftar", "signup"],
  signup: ["daftar", "registrasi"],
  kelas: ["tenant", "organisasi"],
  tenant: ["kelas"],
  tugas: ["task"],
  jadwal: ["schedule"],
  schedule: ["jadwal"],
  informasi: ["pengumuman", "info"],
  info: ["informasi", "pengumuman"],
  verifikasi: ["persetujuan", "approve", "konfirmasi"],
  login: ["masuk"],
  seminar: ["acara"],
  asal: ["tentang", "sejarah", "about", "identitas"],
  sejarah: ["asal", "tentang", "about"],
  tentang: ["asal", "sejarah", "about", "identitas"],
};

export function stemToken(token: string): string {
  if (token.length < 4) return token;

  let stem = token;

  for (const suffix of STEM_SUFFIXES) {
    if (stem.endsWith(suffix) && stem.length - suffix.length >= 4) {
      stem = stem.slice(0, -suffix.length);
      break;
    }
  }

  for (const prefix of STEM_PREFIXES) {
    if (stem.startsWith(prefix) && stem.length - prefix.length >= 4) {
      stem = stem.slice(prefix.length);
      break;
    }
  }

  return stem;
}

const STOPWORDS = new Set<string>([
  "yang", "dan", "di", "ke", "dari", "untuk", "pada", "dengan", "atau", "ini",
  "itu", "akan", "tidak", "tak", "bisa", "dapat", "saya", "anda", "kami",
  "kita", "mereka", "adalah", "apakah", "bagaimana", "kapan", "dimana",
  "mengapa", "apa", "sesuai", "per", "karena", "agar", "supaya",
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

let knowledgeIndex: IndexedFile[] = [];
let invertedIndex: Map<string, InvertedIndexEntry[]> = new Map();
let isLoaded = false;
let currentVersion = 0;
let loadPromise: Promise<void> | null = null;

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

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .map(stemToken)
    .filter((t) => t.length >= 3);
}

function buildInvertedIndex(files: IndexedFile[]): void {
  invertedIndex = new Map();

  files.forEach((file, fileIndex) => {
    const seenInBody = new Set<string>();

    for (const token of file.bodyTokens) {
      seenInBody.add(token);

      const entry = invertedIndex.get(token);
      if (entry) {
        let updated = false;
        for (const e of entry) {
          if (e.fileIndex === fileIndex) {
            e.bodyScore += 1;
            updated = true;
            break;
          }
        }
        if (!updated) {
          entry.push({ fileIndex, bodyScore: 1, headerScore: 0 });
        }
      } else {
        invertedIndex.set(token, [{ fileIndex, bodyScore: 1, headerScore: 0 }]);
      }
    }

    for (const token of file.headerTokens) {
      if (seenInBody.has(token)) continue;

      const entry = invertedIndex.get(token);
      if (entry) {
        let updated = false;
        for (const e of entry) {
          if (e.fileIndex === fileIndex) {
            e.headerScore += 1;
            updated = true;
            break;
          }
        }
        if (!updated) {
          entry.push({ fileIndex, bodyScore: 0, headerScore: 1 });
        }
      } else {
        invertedIndex.set(token, [{ fileIndex, bodyScore: 0, headerScore: 1 }]);
      }
    }
  });
}

function extractRelevantExcerpts(
  file: IndexedFile,
  queryTokens: string[],
  maxChars: number = 1500
): string {
  const paragraphs = file.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return "";

  const queryTokenSet = new Set(queryTokens);
  let bestStart = 0;
  let bestScore = -1;

  for (let i = 0; i < paragraphs.length; i++) {
    const pTokens = tokenize(paragraphs[i]);
    let score = 0;
    for (const t of pTokens) {
      if (queryTokenSet.has(t)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }

  const windowSize = 3;
  let selected: string[] = [];
  let currentLength = 0;

  for (let i = 0; i < Math.min(windowSize, paragraphs.length); i++) {
    const idx = bestStart + i;
    if (idx >= paragraphs.length) break;
    const para = paragraphs[idx];
    if (currentLength + para.length > maxChars) {
      const remaining = Math.max(0, maxChars - currentLength);
      if (remaining > 0) selected.push(para.slice(0, remaining));
      break;
    }
    selected.push(para);
    currentLength += para.length;
  }

  if (selected.length === 0 && paragraphs.length > 0) {
    selected = [paragraphs.slice(0, Math.min(3, paragraphs.length)).join("\n\n")];
  }

  return selected.join("\n\n");
}

export async function loadKnowledgeBase(force: boolean = false): Promise<KnowledgeFile[]> {
  if (loadPromise) return loadPromise.then(() => knowledgeIndex.map(toKnowledgeFile));
  if (isLoaded && !force) return knowledgeIndex.map(toKnowledgeFile);

  loadPromise = (async () => {
    const baseDir = getDatasetDirectory();
    const collected: KnowledgeFile[] = [];
    try {
      await fs.access(baseDir);
      await collectDirectory(baseDir, baseDir, collected);
    } catch {
    }

    knowledgeIndex = collected.map((f) => ({
      ...f,
      bodyTokens: tokenize(f.content),
      headerTokens: tokenize(`${f.name} ${f.category}`),
      tokenSet: new Set(tokenize(f.content)),
    }));

    buildInvertedIndex(knowledgeIndex);
    currentVersion += 1;
    isLoaded = true;
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }

  return knowledgeIndex.map(toKnowledgeFile);
}

function toKnowledgeFile(file: IndexedFile): KnowledgeFile {
  return {
    name: file.name,
    path: file.path,
    category: file.category,
    content: file.content,
  };
}

export function isKnowledgeLoaded(): boolean {
  return isLoaded;
}

export function getKnowledgeVersion(): number {
  return currentVersion;
}

export function getKnowledgeFiles(): KnowledgeFile[] {
  return knowledgeIndex.map(toKnowledgeFile);
}

export function resetKnowledgeBase(): void {
  knowledgeIndex = [];
  invertedIndex = new Map();
  isLoaded = false;
  currentVersion = 0;
  loadPromise = null;
}

export function retrieveRelevantContext(
  query: string,
  maxFiles: number = 3
): RetrievedKnowledge | null {
  if (!isLoaded || knowledgeIndex.length === 0) return null;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return null;

  // Expand the query with synonyms (e.g. daftar <-> registrasi) so retrieval
  // catches questions worded differently from the dataset. Synonym tokens are
  // scored at half weight below, keeping direct keyword matches dominant.
  const baseTokenSet = new Set<string>(queryTokens);
  const synonymSet = new Set<string>();
  for (const qt of queryTokens) {
    const synonyms = QUERY_SYNONYMS[qt];
    if (!synonyms) continue;
    for (const syn of synonyms) {
      const stemmed = stemToken(syn.toLowerCase().trim());
      if (stemmed.length >= 3) synonymSet.add(stemmed);
    }
  }
  const expandedTokens = Array.from(new Set([...baseTokenSet, ...synonymSet]));

  const scores: Map<number, { score: number; matched: number }> = new Map();
  let totalMatchedTokens = 0;

  const isExpandedToken = (t: string): boolean => !baseTokenSet.has(t);
  const totalDocs = knowledgeIndex.length;

  for (const qToken of expandedTokens) {
    const postings = invertedIndex.get(qToken);
    if (!postings || postings.length === 0) continue;

    const weight = isExpandedToken(qToken) ? 0.5 : 1;

    const df = postings.length;
    const idf = 1 + Math.log(totalDocs / Math.max(1, df));

    totalMatchedTokens += 1;
    for (const entry of postings) {
      const contribution = (entry.bodyScore * 2 + entry.headerScore * 1) * weight * idf;
      const existing = scores.get(entry.fileIndex);
      if (existing) {
        existing.score += contribution;
        existing.matched += 1;
      } else {
        scores.set(entry.fileIndex, {
          score: contribution,
          matched: 1,
        });
      }
    }
  }

  if (scores.size === 0 || totalMatchedTokens === 0) return null;

  const maxInputChars = AIAssistantConfig.maxInputChars;

  const scored = Array.from(scores.entries())
    .map(([fileIndex, { score, matched }]) => ({
      fileIndex,
      file: knowledgeIndex[fileIndex],
      score,
      matched,
    }))
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.matched - a.matched ||
        a.file.path.localeCompare(b.file.path)
    )
    .slice(0, Math.max(1, maxFiles));

  if (scored.length === 0) return null;

  const contextParts: string[] = [];
  let currentLength = 0;

  for (const { file } of scored) {
    const excerpt = extractRelevantExcerpts(file, expandedTokens, Math.floor(maxInputChars / scored.length));
    if (excerpt.length > 0) {
      const block = `[${file.path}](${file.path})\nKategori: ${file.category}\n${excerpt}`;
      if (currentLength + block.length > maxInputChars) break;
      contextParts.push(block);
      currentLength += block.length;
    }
  }

  if (contextParts.length === 0) return null;

  const context = contextParts.join("\n\n---\n\n");

  const sources: Source[] = scored.map(({ file }) => ({
    title: file.name,
    path: file.path,
    category: file.category,
  }));

  return { context, sources };
}