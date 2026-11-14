"use client";

import { Button, ButtonLink } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="container-page flex min-h-[70vh] flex-col items-start justify-center pt-32" role="alert">
      <h1 className="text-4xl sm:text-5xl">Something went wrong.</h1>
      <p className="mt-4 max-w-lg text-slate-soft">We could not load this page. Please try again, or contact us directly if the problem continues.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
      </div>
    </section>
  );
}
