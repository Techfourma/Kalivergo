import { AIAssistantConfig } from "../config";

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = AIAssistantConfig.requestTimeoutMs
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function* withStreamTimeout<T>(
  generator: AsyncGenerator<T>,
  ms: number = AIAssistantConfig.requestTimeoutMs
): AsyncGenerator<T> {
  // Timeout applies to EACH requested chunk, not to the whole stream. This
  // keeps long answers alive as long as the provider keeps sending data,
  // while still failing fast on a stalled connection. The previous
  // implementation used a fixed overall deadline which truncated long
  // responses mid-sentence.
  while (true) {
    const next = await withTimeout(generator.next(), ms);
    if (next.done) break;
    yield next.value;
  }
}
