export async function GET() {
  try {
    const response =
      await fetch(
        "http://localhost:11434/api/tags"
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