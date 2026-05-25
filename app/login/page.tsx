import Link from "next/link";
import { Logo } from "@/app/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grain" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.2fr_minmax(440px,520px)]">
        {/* Editorial column */}
        <aside className="relative hidden flex-col justify-between border-r border-[--color-rule] p-12 lg:flex">
          <Link
            href="/"
            className="label-eyebrow w-fit hover:text-[--color-claret]"
          >
            ← Voltar à entrada
          </Link>

          <div className="space-y-10">
            <div className="space-y-6">
              <Logo size="md" priority />
              <p className="label-eyebrow text-[--color-claret]">Documento I · Acesso</p>
              <h1 className="headline text-[clamp(3rem,7vw,6.5rem)] text-[--color-ink]">
                Acesso restrito ao
                <br />
                <em>painel</em>
                <br />
                administrativo.
              </h1>
            </div>

            <blockquote className="border-l-2 border-[--color-claret] pl-6">
              <p className="font-serif text-2xl italic leading-snug text-[--color-ink-2]">
                &ldquo;Se você fracassar em planejar, planeja-se para o
                fracasso.&rdquo;
              </p>
              <footer className="mt-3 label-eyebrow text-[--color-claret]">
                — Ronny Charles
              </footer>
            </blockquote>
          </div>

          <div className="flex items-center justify-between border-t border-[--color-rule] pt-5">
            <span className="label-eyebrow">Conexão segura · TLS</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--color-ink-mute]">
              Supabase
            </span>
          </div>
        </aside>

        {/* Form column */}
        <section className="relative flex flex-col justify-center bg-[--color-paper-soft] p-8 sm:p-14">
          <Link
            href="/"
            className="label-eyebrow mb-10 inline-block w-fit hover:text-[--color-claret] lg:hidden"
          >
            ← Voltar
          </Link>

          <div className="mb-10">
            <p className="label-eyebrow text-[--color-claret]">Identificação</p>
            <h2 className="headline mt-2 text-5xl text-[--color-ink]">
              Entrar.
            </h2>
            <p className="mt-3 font-serif text-lg italic text-[--color-ink-dim]">
              Use seu nome de usuário e senha.
            </p>
          </div>

          <LoginForm />

          <div className="mt-12 flex items-center justify-between border-t border-[--color-rule] pt-5">
            <span className="label-eyebrow">
              Painel público disponível em{" "}
              <Link href="/dashboard" className="text-[--color-claret] underline-offset-4 hover:underline">
                /dashboard
              </Link>
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
