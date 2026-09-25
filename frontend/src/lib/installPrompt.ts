import { useSyncExternalStore } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// Chrome fires beforeinstallprompt once, early; capture it at startup so the menu can offer it later.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type InstallState = { canPrompt: boolean; needsIosSteps: boolean; installed: boolean };
let snapshot: InstallState = { canPrompt: false, needsIosSteps: false, installed: false };

function read(): InstallState {
  const standalone = typeof window !== 'undefined' && isStandalone();
  const next: InstallState = {
    canPrompt: Boolean(deferred) && !standalone,
    needsIosSteps: typeof window !== 'undefined' && isIOS() && !standalone,
    installed: installed || standalone,
  };
  if (
    next.canPrompt !== snapshot.canPrompt ||
    next.needsIosSteps !== snapshot.needsIosSteps ||
    next.installed !== snapshot.installed
  ) {
    snapshot = next;
  }
  return snapshot;
}

/** Whether the desk can be installed here, and how: the browser prompt, or iOS Share-sheet steps. */
export function useInstallState() {
  return useSyncExternalStore(subscribe, read, () => snapshot);
}

/** Opens the browser's install prompt. Resolves true when the user accepts. */
export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  await event.prompt();
  const choice = await event.userChoice;
  emit();
  return choice.outcome === 'accepted';
}
