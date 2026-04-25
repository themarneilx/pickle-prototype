import Link from "next/link";
import { CircleDot, LayoutDashboard } from "lucide-react";

type SiteNavProps = {
  active?: "booking" | "staff";
};

export function SiteNav({ active = "booking" }: SiteNavProps) {
  const staffStateClass = active === "staff" ? "bg-coral text-white" : "bg-ink text-cream hover:bg-coral";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-sage/30 bg-cream/85 px-6 py-4 backdrop-blur-xl lg:px-12">
      <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-full border border-coral/50 bg-coral/10 text-coral">
          <CircleDot size={17} aria-hidden="true" />
        </span>
        Smash<span className="text-coral">Court</span>
      </Link>

      <Link
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition md:hidden ${staffStateClass}`}
        href="/staff"
      >
        <LayoutDashboard size={16} aria-hidden="true" />
        Staff
      </Link>

      <div className="hidden items-center gap-8 text-sm font-semibold uppercase md:flex">
        <Link className="text-ink-mid transition hover:text-ink" href="/#courts">
          Courts
        </Link>
        <Link className="text-ink-mid transition hover:text-ink" href="/#booking">
          Booking
        </Link>
        <Link
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${staffStateClass}`}
          href="/staff"
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          Staff
        </Link>
      </div>
    </nav>
  );
}
