import PublicShell from "@/components/layout/public-shell";
import { SmoothScroller } from "@/features/public/components/SmoothScroller";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroller>
      <PublicShell>{children}</PublicShell>
    </SmoothScroller>
  );
}
