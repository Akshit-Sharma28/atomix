export async function GET() {
  try {
    const baseUrl =
      process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434";

    const response =
      await fetch(
        `${baseUrl}/api/tags`
      );

    if (!response.ok) {
      throw new Error();
    }

    const data =
      await response.json();

    return Response.json({
      status: "online",
      models:
        data.models ?? [],
    });
  } catch {
    return Response.json({
      status: "offline",
      models: [],
    });
  }
}
