import fs from "fs";
import { extractPdfText }
from "../services/knowledge/pdf.service";

async function main() {
  const buffer =
    fs.readFileSync(
      "./sample.pdf"
    );

  const text =
    await extractPdfText(
      buffer
    );

  console.log(
    text.substring(0, 1000)
  );
}

main();