"use client";

import {
  Bot,
  Check,
  ChevronDown,
  KeyRound,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Provider =
  | "openai"
  | "claude"
  | "openrouter";

type Model = {
  id: string;
  name: string;
  provider: Provider;
  available: boolean;
};

type MapContext = {
  center?: {
    lat: number;
    lon: number;
  };

  zoom?: number;

  selectedLocation?: {
    name: string;
    lat: number;
    lon: number;
  };

  droppedPin?: {
    lat: number;
    lon: number;
    address?: string;
  };

  walkability?: {
    score: number;
    rating: string;

    categories: {
      grocery: number;
      transit: number;
      food: number;
      healthcare: number;
      parks: number;
      schools: number;
      pedestrian: number;
    };

    nearbyPlaces: {
      id: string;
      name: string;
      category: string;
      lat: number;
      lon: number;
      distance: number;
    }[];
  };
};

export type MapAction =
  | {
      type: "zoom";
      direction: "in" | "out";
      amount: number;
    }
  | {
      type: "pan";
      latitude: number;
      longitude: number;
    }
  | {
      type: "location";
      latitude: number;
      longitude: number;
      label?: string;
    };

type AiChatProps = {
  mapContext: MapContext;
  onMapAction: (
    action: MapAction,
  ) => void;
};

const PROVIDERS: {
  id: Provider;
  name: string;
  description: string;
}[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    description:
      "Use supported models through OpenRouter.",
  },
  {
    id: "openai",
    name: "OpenAI",
    description:
      "OpenAI integration will be available later.",
  },
  {
    id: "claude",
    name: "Claude",
    description:
      "Claude integration will be available later.",
  },
];

const MODELS: Model[] = [
  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Gemma 4 26B A4B",
    provider: "openrouter",
    available: true,
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B",
    provider: "openrouter",
    available: true,
  },
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    available: false,
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    available: false,
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    provider: "claude",
    available: false,
  },
  {
    id: "claude-opus",
    name: "Claude Opus",
    provider: "claude",
    available: false,
  },
];

const PROVIDER_NAMES: Record<
  Provider,
  string
> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  claude: "Claude",
};

const PROVIDER_PLACEHOLDERS: Record<
  Provider,
  string
> = {
  openrouter: "sk-or-...",
  openai: "sk-...",
  claude: "sk-ant-...",
};

export function AiChat({
  mapContext,
  onMapAction,
}: AiChatProps) {
  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<
      {
        role:
          | "user"
          | "assistant";
        content: string;
      }[]
    >([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
  ] = useState(false);

  const [
    selectedProvider,
    setSelectedProvider,
  ] =
    useState<Provider>(
      "openrouter",
    );

  const [apiKey, setApiKey] =
    useState("");

  const [apiKeys, setApiKeys] =
    useState<
      Partial<
        Record<Provider, string>
      >
    >({});

  const [
    selectedModel,
    setSelectedModel,
  ] = useState<Model>(
    MODELS[0],
  );

  const [
    isModelSelectorOpen,
    setIsModelSelectorOpen,
  ] = useState(false);

  const hasOpenRouterKey =
    Boolean(
      apiKeys.openrouter?.trim(),
    );

  function openApiKeyModal(
    provider: Provider = "openrouter",
  ) {
    setSelectedProvider(provider);
    setApiKey("");
    setIsApiKeyModalOpen(true);
  }

  function handleSaveApiKey() {
    const trimmed =
      apiKey.trim();

    if (!trimmed) {
      return;
    }

    if (
      selectedProvider !==
      "openrouter"
    ) {
      return;
    }

    setApiKeys(
      (current) => ({
        ...current,
        [selectedProvider]:
          trimmed,
      }),
    );

    setApiKey("");
    setIsApiKeyModalOpen(false);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmed =
      message.trim();

    if (
      !trimmed ||
      isLoading
    ) {
      return;
    }

    if (
      selectedModel.provider !==
      "openrouter"
    ) {
      return;
    }

    const openRouterKey =
      apiKeys.openrouter;

    if (!openRouterKey) {
      openApiKeyModal(
        "openrouter",
      );

      return;
    }

    const userMessage = {
      role: "user" as const,
      content: trimmed,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(
      nextMessages,
    );

    setMessage("");
    setIsLoading(true);

    try {
      const response =
        await fetch(
          "/api/agent",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              apiKey:
                openRouterKey,
              model:
                selectedModel.id,
              message:
                trimmed,
              history:
                messages,
              mapContext,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "The AI agent failed to respond.",
        );
      }

      if (
        Array.isArray(
          data.actions,
        )
      ) {
        for (
          const action of data.actions
        ) {
          if (
            action.name ===
            "zoom_map"
          ) {
            onMapAction({
              type: "zoom",
              direction:
                action.args
                  ?.direction,
              amount:
                action.args
                  ?.amount ?? 1,
            });
          }

          if (
            action.name ===
            "pan_map"
          ) {
            onMapAction({
              type: "pan",
              latitude:
                action.args
                  ?.latitude,
              longitude:
                action.args
                  ?.longitude,
            });
          }

          if (
            action.name ===
            "set_map_location"
          ) {
            onMapAction({
              type: "location",
              latitude:
                action.args
                  ?.latitude,
              longitude:
                action.args
                  ?.longitude,
              label:
                action.args
                  ?.label,
            });
          }
        }
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            data.content ||
            "Done.",
        },
      ]);
    } catch (error) {
      console.error(
        "AI chat error:",
        error,
      );

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            error instanceof
            Error
              ? error.message
              : "Something went wrong while contacting the AI agent.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <aside className="flex h-full w-[380px] max-w-[85vw] shrink-0 flex-col border-r border-neutral-200 bg-white">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100">
              <Sparkles className="size-4 text-neutral-700" />
            </div>

            <div>
              <h2 className="text-sm font-medium text-neutral-900">
                AI Agent
              </h2>

              <p className="text-xs text-neutral-500">
                Ask about the map
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 rounded-lg text-neutral-500 hover:text-neutral-900"
            aria-label="Manage API keys"
            onClick={() =>
              openApiKeyModal(
                "openrouter",
              )
            }
          >
            <KeyRound className="size-4" />
          </Button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!hasOpenRouterKey &&
          messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="w-full max-w-[280px] text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-neutral-100">
                  <KeyRound className="size-5 text-neutral-600" />
                </div>

                <h3 className="mt-3 text-sm font-medium text-neutral-900">
                  Add an API key to get started
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  OnFoot.walk uses
                  your own model API
                  credits. Add a key
                  for OpenRouter to
                  use the agent.
                </p>

                <Button
                  type="button"
                  size="sm"
                  className="mt-4 h-8 rounded-lg px-3 text-xs"
                  onClick={() =>
                    openApiKeyModal(
                      "openrouter",
                    )
                  }
                >
                  <KeyRound className="mr-1.5 size-3.5" />
                  Add API Key
                </Button>
              </div>
            </div>
          ) : messages.length ===
            0 ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-neutral-100 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-neutral-700">
                  Hi! I&apos;m your
                  geospatial AI agent.
                  Ask me about
                  locations, nearby
                  places, walkability,
                  or control the map
                  using natural language.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={
                      item.role ===
                      "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        item.role ===
                        "user"
                          ? "max-w-[85%] rounded-xl bg-neutral-900 px-3 py-2.5 text-xs leading-relaxed text-white"
                          : "max-w-[90%] rounded-xl bg-neutral-100 px-3 py-2.5 text-xs leading-relaxed text-neutral-700"
                      }
                    >
                      {item.content}
                    </div>
                  </div>
                ),
              )}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-neutral-100 px-3 py-2.5 text-xs text-neutral-500">
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="shrink-0 border-t border-neutral-200 p-3">
          {/* Model selector */}
          <div className="relative mb-2">
            <Button
              type="button"
              variant="ghost"
              className="h-7 w-full justify-between rounded-lg px-2.5 text-xs font-normal text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              onClick={() =>
                setIsModelSelectorOpen(
                  (current) =>
                    !current,
                )
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <Bot className="size-3.5 shrink-0 text-neutral-500" />

                <span className="truncate">
                  {
                    selectedModel.name
                  }
                </span>

                <span className="truncate text-[10px] text-neutral-400">
                  {
                    PROVIDER_NAMES[
                      selectedModel
                        .provider
                    ]
                  }
                </span>
              </span>

              <ChevronDown
                className={`size-3.5 shrink-0 transition-transform ${
                  isModelSelectorOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </Button>

            {isModelSelectorOpen ? (
              <div className="absolute bottom-full left-0 z-[1100] mb-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                {(
                  [
                    "openrouter",
                    "openai",
                    "claude",
                  ] as Provider[]
                ).map(
                  (
                    provider,
                  ) => {
                    const providerModels =
                      MODELS.filter(
                        (
                          model,
                        ) =>
                          model.provider ===
                          provider,
                      );

                    return (
                      <div
                        key={
                          provider
                        }
                      >
                        <div className="px-2.5 pb-1 pt-2 text-[9px] font-medium uppercase tracking-wide text-neutral-400">
                          {
                            PROVIDER_NAMES[
                              provider
                            ]
                          }
                        </div>

                        {providerModels.map(
                          (
                            model,
                          ) => {
                            const isSelected =
                              selectedModel.id ===
                              model.id;

                            return (
                              <button
                                key={
                                  model.id
                                }
                                type="button"
                                disabled={
                                  !model.available
                                }
                                className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-xs ${
                                  model.available
                                    ? "hover:bg-neutral-50"
                                    : "cursor-not-allowed opacity-40"
                                }`}
                                onClick={() => {
                                  if (
                                    !model.available
                                  ) {
                                    return;
                                  }

                                  if (
                                    !hasOpenRouterKey
                                  ) {
                                    openApiKeyModal(
                                      "openrouter",
                                    );

                                    setIsModelSelectorOpen(
                                      false,
                                    );

                                    return;
                                  }

                                  setSelectedModel(
                                    model,
                                  );

                                  setIsModelSelectorOpen(
                                    false,
                                  );
                                }}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Bot className="size-3.5 shrink-0 text-neutral-400" />

                                  <span className="truncate text-neutral-700">
                                    {
                                      model.name
                                    }
                                  </span>
                                </span>

                                <span className="flex shrink-0 items-center gap-1.5">
                                  {!model.available ? (
                                    <span className="text-[9px] text-neutral-400">
                                      Coming soon
                                    </span>
                                  ) : null}

                                  {isSelected &&
                                  model.available ? (
                                    <Check className="size-3.5 text-neutral-700" />
                                  ) : null}
                                </span>
                              </button>
                            );
                          },
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            ) : null}
          </div>

          {/* Message input */}
          <form
            onSubmit={
              handleSubmit
            }
            className="flex items-center gap-2"
          >
            <Input
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              placeholder={
                hasOpenRouterKey
                  ? "Ask or give me a task..."
                  : "Add an API key to use the agent..."
              }
              disabled={
                !hasOpenRouterKey ||
                isLoading
              }
              className="h-8 rounded-lg border-neutral-200 bg-neutral-50 px-2.5 text-xs shadow-none placeholder:text-xs focus-visible:ring-2 md:text-xs"
            />

            <Button
              type="submit"
              size="icon-sm"
              aria-label="Send message"
              className="size-8 shrink-0 rounded-lg"
              disabled={
                !hasOpenRouterKey ||
                isLoading ||
                !message.trim()
              }
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      </aside>

      {/* API Key Modal */}
      {isApiKeyModalOpen ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 px-4"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setIsApiKeyModalOpen(
                false,
              );
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100">
                  <KeyRound className="size-4 text-neutral-700" />
                </div>

                <div>
                  <h2 className="text-sm font-medium text-neutral-900">
                    API Keys
                  </h2>

                  <p className="text-xs text-neutral-500">
                    Connect your AI provider
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                onClick={() =>
                  setIsApiKeyModalOpen(
                    false,
                  )
                }
                aria-label="Close API key modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Provider selector */}
            <div className="px-5 pt-5">
              <p className="mb-2 text-xs font-medium text-neutral-700">
                Provider
              </p>

              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(
                  (
                    provider,
                  ) => {
                    const isSelected =
                      selectedProvider ===
                      provider.id;

                    const isConfigured =
                      Boolean(
                        apiKeys[
                          provider.id
                        ]?.trim(),
                      );

                    const isAvailable =
                      provider.id ===
                      "openrouter";

                    return (
                      <button
                        key={
                          provider.id
                        }
                        type="button"
                        disabled={
                          !isAvailable
                        }
                        className={`relative rounded-lg border px-2.5 py-2.5 text-left transition-colors ${
                          !isAvailable
                            ? "cursor-not-allowed border-neutral-200 opacity-40"
                            : isSelected
                              ? "border-neutral-900 bg-neutral-50"
                              : "border-neutral-200 hover:bg-neutral-50"
                        }`}
                        onClick={() => {
                          if (
                            !isAvailable
                          ) {
                            return;
                          }

                          setSelectedProvider(
                            provider.id,
                          );

                          setApiKey("");
                        }}
                      >
                        <span className="block text-xs font-medium text-neutral-800">
                          {
                            provider.name
                          }
                        </span>

                        {!isAvailable ? (
                          <span className="mt-1 block text-[9px] text-neutral-400">
                            Coming soon
                          </span>
                        ) : isConfigured ? (
                          <span className="mt-1 flex items-center gap-1 text-[9px] text-neutral-500">
                            <Check className="size-2.5" />
                            Added
                          </span>
                        ) : (
                          <span className="mt-1 block text-[9px] text-neutral-400">
                            Not configured
                          </span>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* API key input */}
            <div className="px-5 pt-5">
              <label
                htmlFor="api-key"
                className="mb-2 block text-xs font-medium text-neutral-700"
              >
                {
                  PROVIDER_NAMES[
                    selectedProvider
                  ]
                }{" "}
                API Key
              </label>

              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(
                  event,
                ) =>
                  setApiKey(
                    event.target
                      .value,
                  )
                }
                placeholder={
                  PROVIDER_PLACEHOLDERS[
                    selectedProvider
                  ]
                }
                disabled={
                  selectedProvider !==
                  "openrouter"
                }
                className="h-9 rounded-lg bg-neutral-50 text-xs shadow-none"
              />

              <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
                You need available
                OpenRouter credits
                for the AI agent to
                make requests.
              </p>
            </div>

            {/* Security notice */}
            <div className="mx-5 mt-4 rounded-lg bg-neutral-50 px-3 py-2.5">
              <p className="text-[10px] leading-relaxed text-neutral-500">
                Your API key is used
                for AI requests and
                is not persisted by
                this interface.
              </p>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-5 py-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs"
                onClick={() =>
                  setIsApiKeyModalOpen(
                    false,
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs"
                disabled={
                  selectedProvider !==
                    "openrouter" ||
                  !apiKey.trim()
                }
                onClick={
                  handleSaveApiKey
                }
              >
                Add API Key
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}