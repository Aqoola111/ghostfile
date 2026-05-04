/** Стабильный ключ для дедупликации в очереди (имя + размер + время модификации). */
export function fileQueueDedupeKey(file: File): string {
  return `${file.name}\0${file.size}\0${file.lastModified}`;
}
