"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  buildWhatsAppHref,
  buildAdmissionsEnquiryMessage,
} from "@/features/public/components/WhatsAppButton";

const CLASS_LEVELS = ["IX", "X", "XI", "XII"];
const BOARDS = ["CBSE", "CISCE"];

interface AdmissionsFormProps {
  whatsappNumber?: string | null;
  instituteName: string;
}

interface FormState {
  name: string;
  phone: string;
  classLevel: string;
  board: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  classLevel?: string;
  board?: string;
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.name.trim()) errors.name = "Please enter your name.";
  const digits = state.phone.replace(/\D/g, "");
  if (!state.phone.trim()) {
    errors.phone = "Please enter your phone number.";
  } else if (digits.length < 10) {
    errors.phone = "Please enter a valid 10-digit phone number.";
  }
  if (!state.classLevel) errors.classLevel = "Please select a class.";
  if (!state.board) errors.board = "Please select a board.";
  return errors;
}

export function AdmissionsForm({ whatsappNumber, instituteName }: AdmissionsFormProps) {
  const [state, setState] = useState<FormState>({
    name: "",
    phone: "",
    classLevel: "",
    board: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  function update(key: keyof FormState, value: string) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submittingRef.current = true;
    setSubmitting(true);

    const message = buildAdmissionsEnquiryMessage({
      instituteName,
      name: state.name,
      phone: state.phone,
      classLevel: state.classLevel,
      board: state.board,
      message: state.message,
    });

    const href = buildWhatsAppHref(whatsappNumber, message);
    if (!whatsappNumber || href === "#") {
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    window.location.assign(href);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
      aria-label="Admissions enquiry form"
    >
      <div>
        <Label htmlFor="admissions-name">Name</Label>
        <Input
          id="admissions-name"
          name="name"
          value={state.name}
          onChange={(event) => update("name", event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "admissions-name-error" : undefined}
          className="mt-1.5"
          placeholder="Your full name"
        />
        {errors.name && (
          <p
            id="admissions-name-error"
            role="alert"
            className="mt-1.5 text-sm text-destructive"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="admissions-phone">Phone</Label>
        <Input
          id="admissions-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          value={state.phone}
          onChange={(event) => update("phone", event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "admissions-phone-error" : undefined}
          className="mt-1.5"
          placeholder="Your phone number"
        />
        {errors.phone && (
          <p
            id="admissions-phone-error"
            role="alert"
            className="mt-1.5 text-sm text-destructive"
          >
            {errors.phone}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admissions-class">Class</Label>
          <select
            id="admissions-class"
            name="classLevel"
            value={state.classLevel}
            onChange={(event) => update("classLevel", event.target.value)}
            aria-invalid={Boolean(errors.classLevel)}
            aria-describedby={errors.classLevel ? "admissions-class-error" : undefined}
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="">Select class</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                Class {level}
              </option>
            ))}
          </select>
          {errors.classLevel && (
            <p
              id="admissions-class-error"
              role="alert"
              className="mt-1.5 text-sm text-destructive"
            >
              {errors.classLevel}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="admissions-board">Board</Label>
          <select
            id="admissions-board"
            name="board"
            value={state.board}
            onChange={(event) => update("board", event.target.value)}
            aria-invalid={Boolean(errors.board)}
            aria-describedby={errors.board ? "admissions-board-error" : undefined}
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="">Select board</option>
            {BOARDS.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          {errors.board && (
            <p
              id="admissions-board-error"
              role="alert"
              className="mt-1.5 text-sm text-destructive"
            >
              {errors.board}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="admissions-message">Message (optional)</Label>
        <Textarea
          id="admissions-message"
          name="message"
          value={state.message}
          onChange={(event) => update("message", event.target.value)}
          className="mt-1.5"
          placeholder="Anything you would like us to know"
          rows={3}
        />
      </div>

      <SubmitButton type="submit" pending={submitting} className="w-full sm:w-auto">
        {submitting ? "Redirecting to WhatsApp…" : "Send Enquiry on WhatsApp"}
      </SubmitButton>
    </form>
  );
}
