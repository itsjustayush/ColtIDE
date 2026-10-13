// Local shim — re-exports Dialog from @colt/ui.
//
// The legacy shadcn/ui dialog wrapper auto-rendered a close button inside
// every DialogContent. @colt/ui's DialogContent exposes `showCloseButton`
// (default `false`); this local wrapper flips the default to `true` so
// existing call sites preserve their close-button affordance without
// changing every import site.
import { forwardRef } from "react";
import {
  DialogContent as ColtDialogContent,
  type DialogContentProps as ColtDialogContentProps,
} from "@colt/ui";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@colt/ui";

export type DialogContentProps = ColtDialogContentProps;

export const DialogContent = forwardRef<HTMLDivElement, ColtDialogContentProps>(
  ({ showCloseButton = true, ...props }, ref) => (
    <ColtDialogContent ref={ref} showCloseButton={showCloseButton} {...props} />
  ),
);
DialogContent.displayName = "DialogContent";
