const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

export async function apiRequest(
  path,
  options = {},
) {
  const headers = new Headers(
    options.headers,
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,

        /*
          Necessário para enviar e receber
          o cookie de autenticação.
        */
        credentials: "include",
      },
    );
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor.",
    );
  }

  const contentType =
    response.headers.get("content-type") ||
    "";

  let data = null;

  if (
    contentType.includes("application/json")
  ) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(
      data?.error ||
        "Não foi possível concluir a solicitação.",
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}