export async function askOllama(
  prompt: string
) {
  const baseUrl =
    process.env.OLLAMA_BASE_URL ??
    "http://localhost:11434";

  const model =
    process.env.OLLAMA_MODEL ??
    "qwen3:8b";

  const apiKey =
    process.env.OLLAMA_API_KEY;

  const response =
    await fetch(
      `${baseUrl}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          ...(apiKey
            ? {
                Authorization:
                  `Bearer ${apiKey}`,
              }
            : {}),
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to reach Ollama"
    );
  }

  const data =
    await response.json();

  return data.response;
}
