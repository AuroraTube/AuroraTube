/** True when the string contains C0 controls or DEL (injection / cache-key noise). */
export function hasControlChars(value: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(value)
}
