import { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const API_URL = process.env.TRANSLATION_API_URL!;
  const AUTH_HEADER = process.env.TRANSLATION_API_AUTH_HEADER!;
  const REFERER = process.env.TRANSLATION_API_REFERER!;

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
      return `Error: ${response.status}`;
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
  } catch (error) {
    console.error("Translation API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
