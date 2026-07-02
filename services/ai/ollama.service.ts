export async function askOllama(
  prompt: string,
  options: {
    timeoutMs?: number;
    numPredict?: number;
    think?: boolean;
  } = {},
) {
  const controller = new AbortController();
  const timeout = windowlessSetTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 20000,
  );
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
          ...(options.think === undefined
            ? {}
            : {
                think: options.think,
              }),
          ...(options.numPredict
            ? {
                options: {
                  num_predict: options.numPredict,
                },
              }
            : {}),
        }),
        signal: controller.signal,
      }
    ).finally(() => windowlessClearTimeout(timeout));

  if (!response.ok) {
    throw new Error(
      `Unable to reach Ollama: ${response.status} ${response.statusText}`
    );
  }

  const data =
    await response.json();

  return data.response;
}

function windowlessSetTimeout(callback: () => void, delay: number) {
  return globalThis.setTimeout(callback, delay);
}

function windowlessClearTimeout(timeout: ReturnType<typeof setTimeout>) {
  globalThis.clearTimeout(timeout);
}
