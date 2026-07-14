import { useState, useTransition } from "react";

export type ActionResponse<T = any> = 
  | { success: true; data?: T } 
  | { success: false; error: string };

interface UseServerActionOptions<TResult> {
  onSuccess?: (data?: TResult) => void;
  onError?: (error: string) => void;
}

export function useServerAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<ActionResponse<TResult>>
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const execute = (args: TArgs, options?: UseServerActionOptions<TResult>) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await action(...args);
        if (!res.success) {
          setError(res.error);
          options?.onError?.(res.error);
        } else {
          options?.onSuccess?.(res.data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
        options?.onError?.(message);
      }
    });
  };

  return { isPending, error, execute, setError };
}
