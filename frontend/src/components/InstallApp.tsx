import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { promptInstall, useInstallState } from '../lib/installPrompt';

const DISMISS_KEY = 'wagerdesk.install-banner-dismissed';

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* private mode: the banner simply returns next visit */
  }
}

/** One entry point for every "Install app" control: the browser prompt, or iOS steps. */
export function useInstallApp() {
  const state = useInstallState();
  const [iosOpen, setIosOpen] = useState(false);

  async function install() {
    if (state.canPrompt) {
      const accepted = await promptInstall();
      if (accepted) toast('WagerDesk is installing on this device.');
      return;
    }
    if (state.needsIosSteps) setIosOpen(true);
  }

  const sheet = <IosInstallSteps open={iosOpen} onOpenChange={setIosOpen} />;
  return { available: !state.installed && (state.canPrompt || state.needsIosSteps), install, sheet };
}

function IosInstallSteps({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const steps = [
    { icon: Share, text: 'Tap the Share button in Safari’s toolbar.' },
    { icon: SquarePlus, text: 'Scroll down and choose Add to Home Screen.' },
    { icon: Download, text: 'Tap Add. WagerDesk opens full screen from your home screen.' },
  ];
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerTitle className="text-[17px] font-semibold">Install WagerDesk on iPhone</DrawerTitle>
          <DrawerDescription className="mt-1 text-[14px] text-muted-foreground">
            Safari installs web apps from the Share sheet.
          </DrawerDescription>
          <ol className="mt-4 divide-y divide-border rounded-lg border border-border">
            {steps.map((step, index) => (
              <li key={step.text} className="flex items-center gap-3 px-4 py-3.5 text-[15px]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <step.icon size={19} className="shrink-0 text-blue-700" />
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-4 h-12 w-full text-[15px]">
            Done
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** A quiet, dismissible offer on phones until the desk is installed. */
export function InstallBanner({ available, onInstall }: { available: boolean; onInstall: () => void }) {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (!available || dismissed) return null;
  return (
    <div className="-mx-4 -mt-5 mb-4 flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:hidden">
      <img src="/pwa-192x192.png" alt="" className="size-10 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">Install WagerDesk</p>
        <p className="truncate text-[12px] text-muted-foreground">Open it from your home screen, full screen.</p>
      </div>
      <Button onClick={onInstall} className="h-9 shrink-0 px-3.5">
        Install
      </Button>
      <button
        onClick={() => {
          writeDismissed();
          setDismissed(true);
        }}
        aria-label="Dismiss install banner"
        className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground"
      >
        <X size={17} />
      </button>
    </div>
  );
}

/** Registers the service worker and asks before swapping in a new version. */
export function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    toast('A new version of WagerDesk is ready.', {
      duration: Infinity,
      action: { label: 'Reload', onClick: () => void updateServiceWorker(true) },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
