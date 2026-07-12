"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTeacherSchema,
  updateTeacherSchema,
  CreateTeacherInput,
  UpdateTeacherInput,
} from "@/lib/validation/teachers";
import { createTeacherAction, updateTeacherAction } from "@/app/admin/teachers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Teacher } from "@prisma/client";

interface TeacherFormDialogProps {
  mode: "create" | "edit";
  teacher?: Teacher;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeacherFormDialog({
  mode,
  teacher,
  trigger,
  onSuccess,
  open,
  onOpenChange,
}: TeacherFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTeacherInput | UpdateTeacherInput>({
    resolver: zodResolver(mode === "create" ? createTeacherSchema : updateTeacherSchema),
    defaultValues: {
      displayName: teacher?.displayName || "",
      phone: teacher?.phone || "",
      email: teacher?.email || "",
      bio: teacher?.bio || "",
      qualifications: teacher?.qualifications || "",
    },
  });

  const onSubmit = async (values: CreateTeacherInput | UpdateTeacherInput) => {
    setIsSubmitting(true);

    try {
      const result =
        mode === "create"
          ? await createTeacherAction(values)
          : await updateTeacherAction(teacher!.id, values as UpdateTeacherInput);

      if (result.error) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Success", {
          description: `Teacher ${mode === "create" ? "created" : "updated"} successfully.`,
        });
        form.reset();
        setIsOpen(false);
        router.refresh();
        onSuccess?.();
      }
    } catch (e: unknown) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Teacher" : "Edit Teacher"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="john@example.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1234567890"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualifications</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="M.Sc. Mathematics"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short bio about the teacher..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Teacher"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
