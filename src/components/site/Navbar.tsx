import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

const LINKS = [
  { hash: "how", label: "Как это работает" },
  { hash: "security", label: "Безопасность" },
  { hash: "law", label: "Закон 377-ФЗ" },
  { hash: "support", label: "Поддержать" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="glass-bar sticky top-0 z-40">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link key={l.hash} to="/" hash={l.hash} className="text-[13px] text-foreground/80 transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <Button asChild variant="pill" size="sm" className="px-4">
            <Link to="/sozdat">Создать документы</Link>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Меню">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-border px-5 pb-5 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.hash} to="/" hash={l.hash} onClick={() => setOpen(false)} className="block border-b border-border py-3.5 text-[17px]">
              {l.label}
            </Link>
          ))}
          <Button asChild variant="pill" size="lg" className="mt-4 w-full">
            <Link to="/sozdat" onClick={() => setOpen(false)}>
              Создать документы
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
