import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <span className="font-semibold tracking-tight text-slate-900">
            Khal Admin
          </span>
          <Link href="/admin" className="text-sm text-slate-600">
            Agenda
          </Link>
          <Link href="/admin/clientes" className="text-sm text-slate-600">
            Clientes
          </Link>
          <Link href="/admin/servicios" className="text-sm text-slate-600">
            Servicios
          </Link>
          <Link href="/admin/bloqueos" className="text-sm text-slate-600">
            Bloqueos
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
