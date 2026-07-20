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
import { SubmitButton } from "@/components/ui/submit-button";

import { Checkbox } from "@/components/ui/checkbox";
import { FormDescription } from "@/components/ui/form";
import type { Subject } from "@prisma/client";

interface TeacherFormDialogProps {
  mode: "create" | "edit";
  teacher?: Teacher;
  availableSubjects: Subject[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TeacherFormDialog({
  mode,
  teacher,
  availableSubjects,
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

  const form = useForm<UpdateTeacherInput>({
    resolver: zodResolver(mode === "create" ? createTeacherSchema : updateTeacherSchema) as any,
    defaultValues: {
      displayName: teacher?.displayName || "",
      phone: teacher?.phone || "",
      email: teacher?.email || "",
      bio: teacher?.bio || "",
      qualifications: teacher?.qualifications || "",
      subjects: teacher?.subjects || [],
    },
  });

  const onSubmit = async (values: UpdateTeacherInput) => {
    setIsSubmitting(true);

    try {
      const result =
        mode === "create"
          ? await createTeacherAction(values as CreateTeacherInput)
          : await updateTeacherAction(teacher!.id, values);

      if (!result.success) {
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
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>
            {mode === "create" ? "Create Teacher" : "Edit Teacher"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <Form {...form}>
            <form
              id="teacher-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              {/* Basic Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
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
                  </div>
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
                </div>
              </section>

              {/* Professional Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Professional Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
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
                    name="subjects"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Subjects</FormLabel>
                          <FormDescription>Select the subjects this teacher can teach.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                          {availableSubjects.map((subject) => (
                            <FormField
                              key={subject.id}
                              control={form.control}
                              name="subjects"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={subject.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(subject.name)}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || [];
                                          return checked
                                            ? field.onChange([...currentValues, subject.name])
                                            : field.onChange(
                                                currentValues.filter(
                                                  (value) => value !== subject.name
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {subject.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
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
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            </form>
          </Form>
        </div>

        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <SubmitButton type="submit" form="teacher-form" pending={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Teacher"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
