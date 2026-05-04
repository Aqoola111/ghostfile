/** Встроенные превью в Inspector (расширяемо). */
export type ViewableFileKind = "pdf" | "code";

const CODE_FILE_RE =
  /\.(txt|md|mdx|json|ts|tsx|mjs|cjs|js|jsx|css|scss|less|html|htm|xml|yaml|yml|svg|vue|svelte|rs|go|py|rb|php|java|kt|swift|c|h|cpp|hpp|cs|sql|sh|bat|ps1|toml|ini|cfg|conf|env|gitignore|dockerignore)$/i;

function mimeLooksLikeCode(type: string): boolean {
  const t = type.toLowerCase();
  if (
    t.startsWith("text/") ||
    t === "application/json" ||
    t === "application/javascript" ||
    t === "application/typescript" ||
    t === "application/xml" ||
    t === "application/yaml" ||
    t === "application/x-yaml" ||
    t === "application/sql"
  ) {
    return true;
  }
  return false;
}

/** PDF имеет приоритет; затем текст/код по MIME или расширению. */
export function getViewableFileKind(file: File): ViewableFileKind | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (mimeLooksLikeCode(type)) {
    return "code";
  }

  if (CODE_FILE_RE.test(name)) {
    return "code";
  }

  if (type === "" || type === "application/octet-stream") {
    if (CODE_FILE_RE.test(name)) {
      return "code";
    }
  }

  return null;
}
