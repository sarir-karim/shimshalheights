import { ButtonLink } from "@/components/ui/Button";

export function NotFoundContent() {
  return (
    <section className="container-page flex min-h-[70vh] flex-col items-start justify-center pt-32">
      <h1 className="text-5xl">Page not found.</h1>
      <p className="mt-4 max-w-lg text-slate-soft">The page you are looking for does not exist or has moved. Try the links below.</p>
      <div className="mt-8 flex gap-3"><ButtonLink href="/">Back to home</ButtonLink><ButtonLink href="/rooms" variant="secondary">View rooms</ButtonLink></div>
    </section>
  );
}
