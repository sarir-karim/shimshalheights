"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ApiError } from "@/lib/adminApi";
import { contactSchema, type ContactValues } from "@/lib/contact";
import { sendContactMessage } from "@/services/contactService";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    setError(null);
    try {
      await sendContactMessage(values);
      setSent(true);
      reset();
    } catch (err) {
      setError(err instanceof ApiError && err.status >= 400 && err.status < 500 ? err.message : "We could not send your message. Please try again, or contact us directly.");
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-xl2 bg-white p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-10 w-10 text-forest" aria-hidden />
        <h2 className="mt-3 text-2xl">Message received</h2>
        <p className="mt-2 text-slate-soft">We will reply by email as soon as we can.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>Send another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Contact form" className="grid gap-4 rounded-xl2 bg-white p-6 shadow-soft sm:grid-cols-2 sm:p-8">
      <Field id="c-name" label="Name" error={errors.name?.message}><input id="c-name" autoComplete="name" className="input-field" {...register("name")} /></Field>
      <Field id="c-email" label="Email" error={errors.email?.message}><input id="c-email" type="email" autoComplete="email" className="input-field" {...register("email")} /></Field>
      <Field id="c-phone" label="Phone (optional)" error={errors.phone?.message}><input id="c-phone" type="tel" autoComplete="tel" className="input-field" {...register("phone")} /></Field>
      <Field id="c-subject" label="Subject" error={errors.subject?.message}><input id="c-subject" className="input-field" {...register("subject")} /></Field>
      <Field id="c-message" label="Message" error={errors.message?.message} className="sm:col-span-2"><textarea id="c-message" rows={6} className="input-field" {...register("message")} /></Field>
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Leave this field empty</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
      <Button type="submit" className="sm:col-span-2" disabled={isSubmitting}>
        {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Sending…</>) : "Send message"}
      </Button>
    </form>
  );
}
