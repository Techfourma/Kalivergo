
export function isUangKasName(name: string): boolean {
  return name.toLowerCase().includes("uang kas");
}

export const UANG_KAS_AMOUNT = 10000;