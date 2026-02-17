"use client";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken } from "../lib/auth";

const items: { label: string; href: Route }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Agenda", href: "/agenda" },
  { label: "Pacientes", href: "/patients" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <div className="nav">
      <strong>Physio MVP</strong>
      {items.map((it) => (
       <Link key={it.href} href={it.href as Route} className={pathname?.startsWith(it.href) ? "active" : ""}>
          {it.label}
        </Link>
      ))}
      <div style={{ marginLeft: "auto" }} />
      <button className="btn secondary" onClick={() => { clearToken(); window.location.href = "/login"; }}>
        Sair
      </button>
    </div>
  );
}
