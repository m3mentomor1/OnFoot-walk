import { NextRequest, NextResponse } from "next/server";

import {
  ALLOWED_MODELS,
  runMapAgent,
} from "@/lib/agent/graph";

type AllowedModel =
  | "google/gemma-4-26b-a4b-it:free"
  | "google/gemma-4-31b-it:free";

export const runtime = "nodejs";

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(
  request: NextRequest,
) {
  try {
    const body = await request.json();

    const {
      apiKey,
      model,
      message,
      history,
      mapContext,
    } = body as {
      apiKey?: string;
      model?: string;
      message?: string;
      history?: ChatHistoryItem[];
      mapContext?: unknown;
    };

    if (
      !apiKey ||
      typeof apiKey !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "An OpenRouter API key is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !model ||
      !ALLOWED_MODELS.includes(
        model as AllowedModel,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only the supported Gemma models are currently available.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !message ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "A message is required.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await runMapAgent({
        apiKey,
        model:
          model as AllowedModel,
        message,
        history,
        mapContext,
      });

    return NextResponse.json(
      result,
    );
  } catch (error) {
    console.error(
      "AI agent error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The AI agent failed to respond.",
      },
      {
        status: 500,
      },
    );
  }
}