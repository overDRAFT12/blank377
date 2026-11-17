import { Link } from "@tanstack/react-router";
import { SITE_NAME } from "@/lib/site";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-foreground">
      <span className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M10 14l2 2 4-4" />
        </svg>
      </span>
      {SITE_NAME}
    </Link>
  );
}
