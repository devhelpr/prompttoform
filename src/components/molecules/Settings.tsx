import { useState, useEffect, useRef } from "react";
import { Alert } from "./Alert";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface APIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

const defaultAPIs: APIConfig[] = [
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  },
  {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || "",
  },
  {
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiKey: import.meta.env.VITE_MISTRAL_API_KEY || "",
  },
  {
    name: "Gemini",
    baseUrl:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=",
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  },
];

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [selectedAPI, setSelectedAPI] = useState<string>(defaultAPIs[0].name);
  const [apiKey, setApiKey] = useState<string>(defaultAPIs[0].apiKey);
  const [apis, setApis] = useState<APIConfig[]>(defaultAPIs);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("llmSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        console.log("Loading saved settings:", parsed);

        // Ensure we have all default APIs included (in case new ones were added in an update)
        const mergedApis = defaultAPIs.map((defaultApi) => {
          const savedApi = parsed.apis.find(
            (api: APIConfig) => api.name === defaultApi.name
          );
          return savedApi || defaultApi;
        });

        setApis(mergedApis);

        // If the selected API exists in our API list, use it, otherwise default to first
        if (
          parsed.selectedAPI &&
          mergedApis.some((api) => api.name === parsed.selectedAPI)
        ) {
          setSelectedAPI(parsed.selectedAPI);
          const selectedApiConfig = mergedApis.find(
            (api) => api.name === parsed.selectedAPI
          );
          setApiKey(selectedApiConfig?.apiKey || "");
        } else {
          setSelectedAPI(mergedApis[0].name);
          setApiKey(mergedApis[0].apiKey || "");
        }
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Control dialog open/close state
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleSave = () => {
    // Create a new array with the updated API key for the selected API
    const updatedApis = apis.map((api) =>
      api.name === selectedAPI ? { ...api, apiKey } : api
    );

    const settings = {
      apis: updatedApis,
      selectedAPI,
    };

    console.log("Saving settings:", settings);
    localStorage.setItem("llmSettings", JSON.stringify(settings));
    onClose();
  };

  // Handle background click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/30 backdrop:backdrop-blur-sm rounded-lg p-0 max-w-lg shadow-xl border-0 m-auto w-full md:w-[32rem]"
      style={{ top: "50%", transform: "translateY(-50%)" }}
      onClick={handleBackdropClick}
    >
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="api-select"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Select API Provider
            </label>
            <select
              id="api-select"
              value={selectedAPI}
              onChange={(e) => {
                setSelectedAPI(e.target.value);
                const selectedApiConfig = apis.find(
                  (api) => api.name === e.target.value
                );
                setApiKey(selectedApiConfig?.apiKey || "");
              }}
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5"
            >
              {apis.map((api) => (
                <option key={api.name} value={api.name}>
                  {api.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="api-key"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 mb-8"
              placeholder="Enter your API key"
            />
            <Alert>
              Your API keys are stored securely in your browser's localStorage.
              We never store your API keys on our servers.
              <br />
              We do use a zero-logging, open-source proxy via cloudflare
              workers. No tracking, no data stored, just your request forwarded.{" "}
              <a href="https://github.com/devhelpr/prompttoform-worker">
                Full code on GitHub
              </a>
              .
            </Alert>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
}
