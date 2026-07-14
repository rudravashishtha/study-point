import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  pending?: boolean;
  loadingText?: React.ReactNode;
}

export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ children, pending, loadingText, disabled, className, ...props }, ref) => {
    // If inside a <form action={...}> without explicit pending prop, fallback to useFormStatus
    const { pending: statusPending } = useFormStatus();
    
    const isPending = pending !== undefined ? pending : statusPending;

    return (
      <Button
        ref={ref}
        type="submit"
        disabled={disabled || isPending}
        aria-disabled={isPending}
        aria-busy={isPending}
        className={className}
        {...props}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="opacity-90">{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);
SubmitButton.displayName = "SubmitButton";
