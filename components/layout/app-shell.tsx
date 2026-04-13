import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">PixelDeck</h1>
            <p className="text-sm text-muted-foreground">High-volume media management for image and video libraries</p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/">Library</Link>
            <Link href="/imports">Imports</Link>
            <Link href="/folders">Folders</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-[1800px] px-4 py-4">{children}</main>
    </div>
  );
}
