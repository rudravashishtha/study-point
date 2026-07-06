import { LoadingState } from "@/components/feedback/loading-state";

export default function Loading() {
  return (
    <div className="p-4">
      <LoadingState label="Loading workspace" />
    </div>
  );
}
