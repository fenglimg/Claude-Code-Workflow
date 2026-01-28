// TypeScript Challenge: Implement first<T> function
// Task: Return the first element of an array, or undefined if empty
// Requirements:
// - Must be generic (work with any type T)
// - Must handle empty arrays
// - Must export the function

export function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
