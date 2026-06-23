import fs from "node:fs/promises";
import path from "node:path";

export type LibraryKnowledgeDocument = {
  id: string;
  title: string;
  source: string;
  documentType: string | null;
  summary: string;
  content: string;
  createdAt: string;
  curated: boolean;
};

type Frontmatter = {
  title?: string;
  source?: string;
  documentType?: string;
  summary?: string;
};

const libraryPath = path.join(process.cwd(), "content", "knowledge");

function parseMarkdown(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return {
      frontmatter: {} as Frontmatter,
      content: raw.trim(),
    };
  }

  const frontmatter = match[1]
    .split("\n")
    .reduce<Frontmatter>((acc, line) => {
      const [key, ...valueParts] = line.split(":");
      const value = valueParts.join(":").trim();

      if (key && value) {
        acc[key.trim() as keyof Frontmatter] = value;
      }

      return acc;
    }, {});

  return {
    frontmatter,
    content: match[2].trim(),
  };
}

export async function getLibraryKnowledgeDocuments(): Promise<
  LibraryKnowledgeDocument[]
> {
  try {
    const files = await fs.readdir(libraryPath);
    const markdownFiles = files.filter((file) => file.endsWith(".md"));
    const stats = await Promise.all(
      markdownFiles.map(async (file) => {
        const filePath = path.join(libraryPath, file);
        const [raw, stat] = await Promise.all([
          fs.readFile(filePath, "utf8"),
          fs.stat(filePath),
        ]);
        const { frontmatter, content } = parseMarkdown(raw);

        return {
          id: `library-${file.replace(/\.md$/, "")}`,
          title:
            frontmatter.title ??
            file
              .replace(/\.md$/, "")
              .replaceAll("-", " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase()),
          source: frontmatter.source ?? "Atomix Library",
          documentType: frontmatter.documentType ?? "Guide",
          summary: frontmatter.summary ?? content.split("\n").find(Boolean) ?? "",
          content,
          createdAt: stat.mtime.toISOString(),
          curated: true,
        };
      })
    );

    return stats.sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}
