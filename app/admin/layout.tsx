import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/app/components/logo";
import { signOut } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 grain" />

      <header className="sticky top-0 z-50 border-b border-[--color-rule] bg-[--color-paper]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4 sm:px-12">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="group flex items-center gap-3">
              <Logo size="sm" priority />
              <div>
                <div className="label-eyebrow text-[--color-claret]">
                  Painel · Administração
                </div>
                <div className="font-serif text-xl text-[--color-ink] group-hover:italic">
                  Processos
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 border-l border-[--color-rule] pl-8 md:flex">
              <Link
                href="/admin"
                className="label-eyebrow hover:text-[--color-claret]"
              >
                Lista
              </Link>
              <Link
                href="/admin/new"
                className="label-eyebrow hover:text-[--color-claret]"
              >
                Novo
              </Link>
              <Link
                href="/admin/usuarios"
                className="label-eyebrow hover:text-[--color-claret]"
              >
                Usuários
              </Link>
              <Link
                href="/admin/logs"
                className="label-eyebrow hover:text-[--color-claret]"
              >
                Logs
              </Link>
              <Link
                href="/dashboard"
                target="_blank"
                rel="noreferrer"
                className="label-eyebrow hover:text-[--color-claret]"
              >
                Telão ↗
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[11px] uppercase tracking-wide text-[--color-ink-dim] md:inline">
              {(user.user_metadata?.username as string) ?? user.email}
            </span>
            <form action={signOut}>
              <button type="submit" className="btn btn-text text-xs">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative">{children}</main>

      <footer className="mt-16 border-t border-[--color-rule] py-6">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 sm:px-12">
          <span className="label-eyebrow">
            Painel de Processos &nbsp;·&nbsp; Documento eletrônico oficial
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--color-ink-mute]">
            v1.1
          </span>
        </div>
      </footer>
    </div>
  );
}
