import { XMLParser } from "fast-xml-parser";

export async function parseBurpXml(xml: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const data = parser.parse(xml);

  const issues = data?.issues?.issue || [];

  return Array.isArray(issues)
    ? issues
    : [issues];
}