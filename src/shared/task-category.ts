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