import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full bg-white/8 px-2.5 py-1 text-xs text-muted-foreground", className)} {...props} />;
}
