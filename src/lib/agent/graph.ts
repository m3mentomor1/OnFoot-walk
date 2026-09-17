import { ChatOpenRouter } from "@langchain/openrouter";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import {
  panMap,
  searchLocation,
  setMapLocation,
  zoomMap,
} from "./tools";

export const ALLOWED_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
] as const;

export type AllowedModel =
  (typeof ALLOWED_MODELS)[number];

const SYSTEM_PROMPT = `
You are the OnFoot.walk AI Agent.

OnFoot.walk is an interactive geospatial walkability mapping application.

Your purpose is to help users understand and interact with the map.

You can:
- Answer questions about the current map
- Explain information displayed in the application
- Explain walkability results
- Explain nearby places
- Search for locations
- Move the map
- Zoom the map

You have these tools:

search_location
zoom_map
pan_map
set_map_location

========================
MAP ACTIONS
========================

If the user asks you to perform a map action, actually use the appropriate tool.

Examples:

"Zoom in"
→ use zoom_map

"Zoom out"
→ use zoom_map

"Zoom in three times"
→ use zoom_map with amount 3

"Find Quezon City"
→ use search_location

"Take me to Makati"
→ use search_location and then set_map_location

"Show me BGC"
→ use search_location and then set_map_location

========================
LOCATION SEARCH
========================

When searching for a location:

1. Call search_location.
2. Examine the returned results.
3. Select the result that best matches the user's request.
4. Call set_map_location using that result's coordinates.

Do not invent coordinates.

========================
CURRENT MAP
========================

You will receive CURRENT MAP CONTEXT.

This can contain:

- Current map center
- Current zoom
- Selected location
- Dropped pin
- Walkability score
- Walkability rating
- Category scores
- Nearby places

Use this information when answering questions about the current map.

Do not invent information that is not contained in the map context.

If the requested information is not available, clearly say that it is not currently available.

========================
WALKABILITY
========================

OnFoot.walk's walkability score is an application-specific heuristic.

It may include:

- Grocery
- Transit
- Food
- Healthcare
- Parks
- Schools
- Pedestrian infrastructure
- Nearby-place diversity

Do not call it the official Walk Score.

Do not claim that the application's straight-line distance calculation
is the same as walking-route distance.

========================
NEARBY PLACES
========================

When nearby places are supplied in the map context, you can answer questions
about them.

For example:

"What groceries are nearby?"
"What is the closest park?"
"How many schools are nearby?"
"What's the nearest healthcare facility?"

Only use places actually supplied in CURRENT MAP CONTEXT.

========================
MAP STATE
========================

The map is controlled by the application.

Never pretend that a map action happened unless you actually called
the appropriate tool.

After successfully performing an action, briefly tell the user what happened.

========================
RESPONSE STYLE
========================

Be concise.

Use natural conversational language.

Do not expose tool names.

Do not describe internal agent reasoning.

CURRENT MAP CONTEXT:

{mapContext}
`;

function createSystemPrompt(
  mapContext: unknown,
) {
  return SYSTEM_PROMPT.replace(
    "{mapContext}",
    JSON.stringify(
      mapContext ?? {
        message:
          "No map context is currently available.",
      },
      null,
      2,
    ),
  );
}

export async function runMapAgent({
  apiKey,
  model,
  message,
  history,
  mapContext,
}: {
  apiKey: string;
  model: AllowedModel;
  message: string;
  history?: {
    role: "user" | "assistant";
    content: string;
  }[];
  mapContext: unknown;
}) {
  const llm = new ChatOpenRouter({
    apiKey,
    model,
    temperature: 0.2,
  });

  const agent = createReactAgent({
    llm,
    tools: [
      searchLocation,
      zoomMap,
      panMap,
      setMapLocation,
    ],
  });

  const messages = [
    new SystemMessage(
      createSystemPrompt(mapContext),
    ),

    ...(history ?? []).map(
      (item) =>
        item.role === "user"
          ? new HumanMessage(
              item.content,
            )
          : {
              role: "assistant" as const,
              content: item.content,
            },
    ),

    new HumanMessage(message),
  ];

  const result = await agent.invoke({
    messages,
  });

  const resultMessages =
    result.messages ?? [];

  const lastMessage =
    resultMessages[
      resultMessages.length - 1
    ];

  let content = "";

  if (
    typeof lastMessage?.content ===
    "string"
  ) {
    content = lastMessage.content;
  } else if (
    Array.isArray(
      lastMessage?.content,
    )
  ) {
    content = lastMessage.content
      .filter(
        (
          item,
        ) =>
          typeof item === "object" &&
          item !== null &&
          "type" in item &&
          item.type === "text",
      )
      .map((item) =>
        "text" in item
          ? String(item.text)
          : "",
      )
      .join("");
  }

  const actions =
    resultMessages.flatMap(
      (item) => {
        if (
          !("tool_calls" in item) ||
          !Array.isArray(
            item.tool_calls,
          )
        ) {
          return [];
        }

        return item.tool_calls.map(
          (call) => ({
            name: call.name,
            args: call.args,
          }),
        );
      },
    );

  return {
    content,
    actions,
  };
}