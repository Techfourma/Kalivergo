/**
 * Kategori tugas yang didukung aplikasi.
 *
 * Nilai disimpan di database (kolom `tasks.category`) sebagai kode internal
 * (`E_LEARNING` / `TATAP_MUKA`) dan dirender menjadi label ramah pengguna
 * ("E-Learning" / "Tatap Muka"). Kategori default untuk tugas baru adalah
 * E-Learning.
 */
export const TASK_CATEGORIES = {
  E_LEARNING: "E-Learning",
  TATAP_MUKA: "Tatap Muka",
} as const;

export type TaskCategory = keyof typeof TASK_CATEGORIES;

export const DEFAULT_TASK_CATEGORY: TaskCategory = "E_LEARNING";

export function isTaskCategory(value: unknown): value is TaskCategory {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(TASK_CATEGORIES, value)
  );
}

export function getTaskCategoryLabel(category: unknown): string {
  if (isTaskCategory(category)) {
    return TASK_CATEGORIES[category];
  }
  return TASK_CATEGORIES[DEFAULT_TASK_CATEGORY];
}