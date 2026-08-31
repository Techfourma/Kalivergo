export function normalizePertemuanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeTaskTitle(title: string): string {
  return normalizePertemuanName(title);
}

export function normalizePertemuanNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = normalizePertemuanName(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

export function getPertemuanSetKey(names: string[]): string {
  return normalizePertemuanNames(names)
    .map((name) => name.toLowerCase())
    .sort()
    .join("|");
}

type TitleLike = { title: string };

export function getDistinctTaskTitles(tasks: TitleLike[]): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const task of tasks) {
    const key = normalizeTaskTitle(task.title).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    titles.push(task.title);
  }
  return titles;
}

export function getTasksByTitle<T extends TitleLike>(
  tasks: T[],
  selectedTitle: string
): T[] {
  if (!selectedTitle) return [];
  const key = normalizeTaskTitle(selectedTitle).toLowerCase();
  return tasks.filter(
    (task) => normalizeTaskTitle(task.title).toLowerCase() === key
  );
}

export function getPertemuanUnion<T extends { pertemuan?: { id: string; name: string }[] | null }>(
  tasks: T[]
): { id: string; name: string }[] {
  const byId = new Map<string, { id: string; name: string }>();
  for (const task of tasks) {
    for (const p of task.pertemuan ?? []) {
      if (!byId.has(p.id)) byId.set(p.id, p);
    }
  }
  return Array.from(byId.values());
}

type ScopeSubmittable = {
  pertemuan?: { id: string }[] | null;
  submissions?: {
    userId: string;
    status?: string;
    pertemuanId?: string | null;
  }[] | null;
};

export function getSubmittedUserIdsForScope<T extends ScopeSubmittable>(
  tasks: T[],
  selectedPertemuanId: string
): Set<string> {
  const ids = new Set<string>();
  const scopedTasks = selectedPertemuanId
    ? tasks.filter((task) =>
        (task.pertemuan ?? []).some((p) => p.id === selectedPertemuanId)
      )
    : tasks;

  for (const task of scopedTasks) {
    for (const submission of task.submissions ?? []) {
      if (submission.status === "PENDING") continue;
      if (selectedPertemuanId) {
        const belongsToSelectedMeeting =
          !submission.pertemuanId &&
          (task.pertemuan ?? []).some((p) => p.id === selectedPertemuanId);
        if (
          submission.pertemuanId === selectedPertemuanId ||
          belongsToSelectedMeeting
        ) {
          ids.add(submission.userId);
        }
      } else {
        ids.add(submission.userId);
      }
    }
  }
  return ids;
}