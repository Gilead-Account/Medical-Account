import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/main.css';

const VEEVA_RUNTIME_WAIT_MS = 3000;
const VEEVA_RUNTIME_POLL_MS = 50;
const VEEVA_RUNTIME_INITIAL_WAIT_MS = 500;

const runtimeSnapshot = () => ({
  q: typeof window.Q,
  utilities: typeof window.VeevaUtilities,
  onlineApi: typeof window.OnlineAPI,
  ds: typeof window.ds,
  currentObjectMethod: typeof window.ds?.getDataForCurrentObject,
  runtimeScriptCount: Array.from(document.scripts).filter((script) =>
    String(script.src || '').startsWith('data:text/javascript;base64,')
  ).length,
});

const runtimeDiagnostics = {
  build: import.meta.env.VITE_DATA_MODE === 'mock'
    ? 'MIPAD-20260807.12-DESKTOP-MOCK'
    : 'MIPAD-20260807.12-DESKTOP-MOCK-LIVE',
  initial: runtimeSnapshot(),
  replayAttempted: false,
  replayResults: [],
  final: null,
};
window.__KAM_VEEVA_BOOTSTRAP__ = runtimeDiagnostics;

//Checks whether the Veeva connection is available.
const hasVeevaDataService = () =>
  typeof window !== 'undefined' &&
  !!window.ds &&
  typeof window.ds.getDataForCurrentObject === 'function';

 //Polls briefly while waiting for that connection
const waitForVeevaDataServiceFor = async (durationMs) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < durationMs) {
    await new Promise((resolve) => window.setTimeout(resolve, VEEVA_RUNTIME_POLL_MS));
    if (hasVeevaDataService()) return true;
  }
  return hasVeevaDataService();
};

//Reloads a packaged runtime script if initialization needs recovery.
const replayRuntimeScript = (sourceScript, label) => new Promise((resolve) => {
  if (!sourceScript?.src) {
    runtimeDiagnostics.replayResults.push(`${label}:missing`);
    resolve();
    return;
  }

  const script = document.createElement('script');
  script.src = sourceScript.src;
  script.onload = () => {
    runtimeDiagnostics.replayResults.push(`${label}:loaded`);
    resolve();
  };
  script.onerror = () => {
    runtimeDiagnostics.replayResults.push(`${label}:error`);
    resolve();
  };
  document.head.appendChild(script);
});

//Main function that Coordinates helper functions. Local development skips waiting for Veeva
const waitForVeevaDataService = async () => {
  if (import.meta.env.DEV || hasVeevaDataService()) {
    runtimeDiagnostics.final = runtimeSnapshot();
    return;
  }

  if (await waitForVeevaDataServiceFor(VEEVA_RUNTIME_INITIAL_WAIT_MS)) {
    runtimeDiagnostics.final = runtimeSnapshot();
    return;
  }

  // Some iPad webviews discover data-URI scripts without executing them in
  // parser order. Replay the exact packaged Q/MyInsights scripts sequentially.
  const runtimeScripts = Array.from(document.scripts).filter((script) =>
    String(script.src || '').startsWith('data:text/javascript;base64,')
  );
  runtimeDiagnostics.replayAttempted = true;
  if (typeof window.Q === 'undefined') {
    await replayRuntimeScript(runtimeScripts[0], 'q');
  }
  if (!hasVeevaDataService()) {
    await replayRuntimeScript(runtimeScripts[1], 'myinsights');
  }

  await waitForVeevaDataServiceFor(VEEVA_RUNTIME_WAIT_MS - VEEVA_RUNTIME_INITIAL_WAIT_MS);
  runtimeDiagnostics.final = runtimeSnapshot();
};

// Load App only after the iPad has had a chance to initialize MyInsights.
// dataservice/client.js intentionally snapshots window.ds when it is imported.
await waitForVeevaDataService();
const { default: App } = await import('@/App');

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
