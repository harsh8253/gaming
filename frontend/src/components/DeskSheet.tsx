import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const PHONE_QUERY = '(max-width: 639.98px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(PHONE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsPhone() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

/**
 * The desk's one overlay surface. Phones get a vaul drawer that drags to
 * dismiss; desktop gets a Radix side sheet (records) or a centred dialog
 * (forms). Mount it while open; it plays its exit before calling onClose.
 */
export function DeskSheet({
  label,
  onClose,
  variant = 'panel',
  children,
}: {
  label: string;
  onClose: () => void;
  variant?: 'panel' | 'dialog';
  children: ReactNode;
}) {
  const isPhone = useIsPhone();
  const [open, setOpen] = useState(true);
  const closing = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(closing.current), []);

  function onOpenChange(next: boolean) {
    if (next) return;
    setOpen(false);
    closing.current = window.setTimeout(onClose, 220);
  }

  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92dvh] data-[vaul-drawer-direction=bottom]:max-h-[92dvh]">
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          <div
            className={`flex min-h-0 flex-1 flex-col ${variant === 'dialog' ? 'overflow-y-auto px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]' : 'pb-[env(safe-area-inset-bottom)]'}`}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (variant === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="block max-h-[92dvh] gap-0 overflow-y-auto p-6 sm:max-w-sm">
          <DialogTitle className="sr-only">{label}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-md">
        <SheetTitle className="sr-only">{label}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
