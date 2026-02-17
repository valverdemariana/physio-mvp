"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken } from "../lib/auth";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agenda", label: "Agenda do dia" },
  { href: "/patients", label: "Pacientes" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <div className="nav">
      <strong>Physio MVP</strong>
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={pathname?.startsWith(it.href) ? "active" : ""}>
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
