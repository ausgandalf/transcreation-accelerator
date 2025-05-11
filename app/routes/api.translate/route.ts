import { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const API_URL = process.env.TRANSLATION_API_URL;
  const AUTH_HEADER = process.env.TRANSLATION_API_AUTH_HEADER;
  const REFERER = process.env.TRANSLATION_API_REFERER;

  // Validate environment variables
  if (!API_URL) {
    console.error("Missing TRANSLATION_API_URL environment variable");
    return new Response(
      JSON.stringify({
        error: "Server configuration error: Missing API URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!AUTH_HEADER) {
    console.error("Missing TRANSLATION_API_AUTH_HEADER environment variable");
    return new Response(
      JSON.stringify({
        error: "Server configuration error: Missing authentication",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!REFERER) {
    console.error("Missing TRANSLATION_API_REFERER environment variable");
    return new Response(
      JSON.stringify({
        error: "Server configuration error: Missing referer",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const requestBody = await request.json();
    const { content } = requestBody;

    if (!content) {
      console.error("Error: No content provided");
      return new Response(
        JSON.stringify({
          error: "Request must include a content string.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_HEADER,
          Referer: REFERER,
        },
        body: JSON.stringify({ content }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`API responded with status: ${response.status}`);
        return new Response(
          JSON.stringify({
            error: `API error: ${response.status} - ${responseText}`,
          }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const data = JSON.parse(responseText);

      return new Response(
        JSON.stringify({
          translatedContent: data.content || "No translation found",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (fetchError: unknown) {
      console.error("Fetch Error:", fetchError);
      return new Response(
        JSON.stringify({
          error:
            fetchError instanceof Error
              ? `Fetch error: ${fetchError.message}`
              : "Unknown fetch error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error: unknown) {
    console.error("Translation API Error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
