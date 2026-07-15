"use server";

import { requireAppUser } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const updatePhoneSchema = z
  .object({
    phone: z.string().min(1, "Phone number is required."),
  })
  .refine(
    (data) => {
      let phoneStr = data.phone.trim();
      if (!phoneStr.startsWith("+")) {
        phoneStr = `+91${phoneStr}`;
      }
      const phoneNumber = parsePhoneNumberFromString(phoneStr);
      return phoneNumber?.isValid() ?? false;
    },
    {
      message:
        "Invalid phone number format. Please provide a valid 10-digit Indian mobile number.",
      path: ["phone"],
    },
  );

export async function updatePhone(
  _prev: { error: string | null; success: boolean },
  formData: FormData,
) {
  const appUser = await requireAppUser();

  const parsed = updatePhoneSchema.safeParse({
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data", success: false };
  }

  let phoneStr = parsed.data.phone.trim();
  if (!phoneStr.startsWith("+")) {
    phoneStr = `+91${phoneStr}`;
  }

  // Parse again to format to E.164 strictly
  const phoneNumber = parsePhoneNumberFromString(phoneStr);
  const e164Phone = phoneNumber?.format("E.164");

  if (!e164Phone) {
    return { error: "Failed to format phone number.", success: false };
  }

  try {
    await db.appUser.update({
      where: { id: appUser.id },
      data: { phone: e164Phone },
    });
  } catch (error) {
    console.error("Failed to update phone:", error);
    return { error: "Failed to update phone number. Please try again.", success: false };
  }

  revalidatePath("/profile");
  return { error: null, success: true };
}

const updateNameSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name is too long."),
});

export async function updateName(
  _prev: { error: string | null; success: boolean },
  formData: FormData,
) {
  const appUser = await requireAppUser();

  const parsed = updateNameSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data", success: false };
  }

  try {
    await db.appUser.update({
      where: { id: appUser.id },
      data: { fullName: parsed.data.fullName.trim() },
    });
  } catch (error) {
    console.error("Failed to update name:", error);
    return { error: "Failed to update name. Please try again.", success: false };
  }

  revalidatePath("/profile");
  return { error: null, success: true };
}
