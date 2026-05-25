import Link from "next/link";
import { Logo } from "@/app/components/logo";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grain" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-8 py-8 sm:px-12 sm:py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[--color-rule] pb-5">
          <div className="flex items-center gap-3">
            <Logo size="sm" priority />
            <span className="label-eyebrow">Painel de Processos</span>
          </div>
          <nav className="hidden items-center gap-8 sm:flex">
            <Link href="/dashboard" className="label-eyebrow hover:text-[--color-claret]">
              Painel Telão
            </Link>
            <Link href="/login" className="label-eyebrow hover:text-[--color-claret]">
              Acessar
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative grid flex-1 grid-cols-12 gap-8 py-16 sm:py-24">
          <div className="col-span-12 lg:col-span-9">
            <p className="reveal-up label-eyebrow text-[--color-claret]">
              Volume I · Edição contínua · {new Date().getFullYear()}
            </p>

            <h1
              className="reveal-up headline mt-8 text-[clamp(3.2rem,9.5vw,5.5rem)] text-[--color-ink]"
              style={{ animationDelay: "120ms" }}
            >
              Acompanhamento de
              <br />
              <em>processos</em>
              <br />
              administrativos.
            </h1>

            <div
              className="reveal-up mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-end"
              style={{ animationDelay: "260ms" }}
            >
              <p className="max-w-xl font-sans text-lg leading-relaxed text-[--color-ink-2] lg:text-xl">
                Cadastre, atualize e exiba processos em tempo real. Um painel discreto
                para a sala administrativa — e um painel público para a parede.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/admin" className="btn btn-primary">
                  Acessar painel administrativo
                </Link>
                <Link href="/dashboard" className="btn btn-ghost">
                  Abrir painel público →
                </Link>
              </div>
            </div>
          </div>

          {/* Right: vertical metadata column */}
          <aside className="col-span-12 mt-10 hidden border-l border-[--color-rule] pl-8 lg:col-span-3 lg:mt-0 lg:block">
            <div className="space-y-8">
              <div>
                <div className="label-eyebrow text-[--color-claret]">Escopo</div>
                <p className="mt-2 font-serif text-xl italic leading-snug text-[--color-ink]">
                  Cadastro, gestão & exibição.
                </p>
              </div>
              <div>
                <div className="label-eyebrow text-[--color-claret]">Distribuição</div>
                <p className="mt-2 font-sans text-base leading-snug text-[--color-ink-2]">
                  Telão público em URL própria.
                </p>
              </div>
              <div>
                <div className="label-eyebrow text-[--color-claret]">Cadência</div>
                <p className="mt-2 font-sans text-base leading-snug text-[--color-ink-2]">
                  24 / 7 — sincronização em tempo real.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* Quote */}
        <section className="border-t border-[--color-rule] py-10">
          <blockquote className="max-w-2xl border-l-2 border-[--color-claret] pl-8">
            <p className="font-serif text-2xl italic leading-snug text-[--color-ink]">
              "Se você fracassar em planejar, planeja-se para o fracasso."
            </p>
            <footer className="mt-4 label-eyebrow text-[--color-claret]">
              — Ronny Charles
            </footer>
          </blockquote>
        </section>

        {/* Footer */}
        <footer className="mt-12 flex flex-col gap-3 border-t border-[--color-rule] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="label-eyebrow">
            Painel de Processos &nbsp;·&nbsp; Documento eletrônico oficial
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--color-ink-mute]">
            v1.1 &nbsp;·&nbsp; BRT
          </span>
        </footer>
      </div>
    </main>
  );
}
