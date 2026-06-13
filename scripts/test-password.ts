import bcrypt from "bcryptjs";

async function main() {
  const hash =
    '$2b$10$AAgdacmbpy/E.F6PdlyGaOjwHPP2m0O7UgRZdNxmf50SFeTtub5ai';

  const valid =
    await bcrypt.compare(
      "Atomix123!",
      hash
    );

  console.log(valid);
}

main();