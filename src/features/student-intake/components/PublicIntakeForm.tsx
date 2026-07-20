"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitIntakeAction } from "@/app/intake/[token]/actions";

export function PublicIntakeForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      token,
      studentName: formData.get("studentName"),
      phone: formData.get("phone"),
      guardianName: formData.get("guardianName"),
      guardianPhone: formData.get("guardianPhone"),
      email: formData.get("email"),
      school: formData.get("school"),
      address: formData.get("address"),
      message: formData.get("message"),
    };

    startTransition(async () => {
      const result = await submitIntakeAction(payload);
      if (!result.success) {
        setError(result.error ?? "Could not submit details.");
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-md border bg-card p-5 text-center shadow-sm sm:p-8">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-semibold">Details submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your information has been received and will be reviewed by the institute.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-md border bg-card p-4 shadow-sm sm:p-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="studentName" className="text-sm font-medium">
          Student name *
        </label>
        <Input id="studentName" name="studentName" autoComplete="name" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Student phone
          </label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="guardianName" className="text-sm font-medium">
            Guardian name
          </label>
          <Input id="guardianName" name="guardianName" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <label htmlFor="guardianPhone" className="text-sm font-medium">
            Guardian phone
          </label>
          <Input id="guardianPhone" name="guardianPhone" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="school" className="text-sm font-medium">
          School
        </label>
        <Input id="school" name="school" />
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <Textarea id="address" name="address" rows={3} />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <Textarea id="message" name="message" rows={3} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit details"}
      </Button>
    </form>
  );
}
