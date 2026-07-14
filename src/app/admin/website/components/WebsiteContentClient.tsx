"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";
import {
  createWhyChooseUsItemAction,
  updateWhyChooseUsItemAction,
  deleteWhyChooseUsItemAction,
  createMethodologyStepAction,
  updateMethodologyStepAction,
  deleteMethodologyStepAction,
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  createFAQAction,
  updateFAQAction,
  deleteFAQAction,
  createPerformanceMetricAction,
  updatePerformanceMetricAction,
  deletePerformanceMetricAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
  updateHomepageSectionAction,
} from "../actions";

const TABS = [
  { id: "homepage", label: "Homepage Sections" },
  { id: "why-choose-us", label: "Why Choose Us" },
  { id: "methodology", label: "Methodology" },
  { id: "testimonials", label: "Testimonials" },
  { id: "gallery", label: "Gallery" },
  { id: "faq", label: "FAQ" },
  { id: "metrics", label: "Metrics" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  whyChooseUsItems: any[];
  methodologySteps: any[];
  testimonials: any[];
  galleryItems: any[];
  faqs: any[];
  performanceMetrics: any[];
  sections: any[];
}

export function WebsiteContentClient(props: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("homepage");

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Website Content</PageHeaderHeading>
          <PageHeaderDescription>
            Manage homepage sections, testimonials, gallery, FAQ, and more.
          </PageHeaderDescription>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            data-active={activeTab === tab.id || undefined}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[active]:border-primary data-[active]:text-foreground"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "homepage" && <HomepageSectionsTab sections={props.sections} />}
      {activeTab === "why-choose-us" && <WhyChooseUsTab items={props.whyChooseUsItems} />}
      {activeTab === "methodology" && <MethodologyTab steps={props.methodologySteps} />}
      {activeTab === "testimonials" && <TestimonialsTab items={props.testimonials} />}
      {activeTab === "gallery" && <GalleryTab items={props.galleryItems} />}
      {activeTab === "faq" && <FAQTab items={props.faqs} />}
      {activeTab === "metrics" && <MetricsTab items={props.performanceMetrics} />}
    </div>
  );
}

function HomepageSectionsTab({ sections }: { sections: any[] }) {
  const router = useRouter();
  const defaultSections = [
    { key: "hero", label: "Hero Section", locked: true },
    { key: "teacher-intro", label: "Teacher Introduction", locked: true },
    { key: "why-choose-us", label: "Why Choose Us" },
    { key: "methodology", label: "Teaching Methodology" },
    { key: "courses", label: "Courses" },
    { key: "testimonials", label: "Testimonials" },
    { key: "performance-metrics", label: "Performance Metrics" },
    { key: "gallery", label: "Gallery" },
    { key: "featured-resources", label: "Featured Resources" },
    { key: "faq", label: "FAQ" },
    { key: "contact", label: "Contact" },
  ];

  const handleToggle = async (sectionKey: string, isVisible: boolean) => {
    const result = await updateHomepageSectionAction(sectionKey, { isVisible });
    if (result.success) {
      toast.success("Section visibility updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Toggle visibility of each homepage section.
      </p>
      {defaultSections.map((def) => {
        const dbSection = sections.find((s: any) => s.sectionKey === def.key);
        const isVisible = dbSection === undefined ? false : dbSection.isVisible;
        return (
          <div
            key={def.key}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <p className="font-medium">{def.label}</p>
              <p className="text-xs text-muted-foreground">{def.key}</p>
            </div>
            <div className="flex items-center gap-2">
              {def.locked && (
                <span className="text-xs text-muted-foreground">Always visible</span>
              )}
              <Switch
                checked={isVisible}
                onCheckedChange={(v) => handleToggle(def.key, v)}
                disabled={def.locked}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Why Choose Us ──

const whyChooseUsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  iconName: z.string().nullable().optional(),
  displayOrder: z.coerce.number().int().optional(),
  isPublished: z.coerce.boolean().optional(),
});

function WhyChooseUsTab({ items }: { items: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(whyChooseUsSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      iconName: "",
      displayOrder: 0,
      isPublished: false,
    },
  });

  const handleEdit = (item: any) => {
    setEditing(item);
    form.reset({
      title: item.title,
      description: item.description,
      iconName: item.iconName || "",
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    form.reset({
      title: "",
      description: "",
      iconName: "",
      displayOrder: 0,
      isPublished: false,
    });
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof whyChooseUsSchema>) => {
    if (editing) {
      const r = await updateWhyChooseUsItemAction(editing.id, data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    } else {
      const r = await createWhyChooseUsItemAction(data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    }
    toast.success(editing ? "Item updated" : "Item created");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteWhyChooseUsItemAction(id);
    if (r.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="size-4" /> Add Item
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {item.isPublished ? (
                  <Eye className="size-4 text-green-600" />
                ) : (
                  <EyeOff className="size-4 text-muted-foreground" />
                )}
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Item" : "Add Item"}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write a short description…"
                      minHeight={160}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iconName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Icon Name <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />
            <SubmitButton>{editing ? "Update" : "Create"}</SubmitButton>
          </form>
        </Form>
      </FormDialog>
    </div>
  );
}

// ── Methodology Steps ──

const methodologySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  stepNumber: z.coerce.number().int().min(1),
  displayOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

function MethodologyTab({ steps }: { steps: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const form = useForm<z.infer<typeof methodologySchema>>({
    resolver: zodResolver(methodologySchema) as any,
    defaultValues: {
      title: "",
      description: "",
      stepNumber: 1,
      displayOrder: 0,
      isPublished: false,
    },
  });

  const handleEdit = (item: any) => {
    setEditing(item);
    form.reset({
      title: item.title,
      description: item.description,
      stepNumber: item.stepNumber,
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    form.reset({
      title: "",
      description: "",
      stepNumber: steps.length + 1,
      displayOrder: 0,
      isPublished: false,
    });
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof methodologySchema>) => {
    if (editing) {
      const r = await updateMethodologyStepAction(editing.id, data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    } else {
      const r = await createMethodologyStepAction(data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteMethodologyStepAction(id);
    if (r.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="size-4" /> Add Step
      </Button>
      {steps.map((step: any) => (
        <div key={step.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {step.stepNumber}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {step.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {step.isPublished ? (
                <Eye className="size-4 text-green-600" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              <Button variant="ghost" size="icon" onClick={() => handleEdit(step)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(step.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Step" : "Add Step"}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write a short description…"
                      minHeight={160}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stepNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Step Number</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />
            <SubmitButton>{editing ? "Update" : "Create"}</SubmitButton>
          </form>
        </Form>
      </FormDialog>
    </div>
  );
}

// ── Testimonials ──

const testimonialSchema = z.object({
  studentName: z.string().min(1, "Name is required"),
  message: z.string().min(1, "Message is required"),
  designation: z.string().optional().nullable(),
  studentClass: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

function TestimonialsTab({ items }: { items: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema) as any,
    defaultValues: {
      studentName: "",
      message: "",
      designation: "",
      studentClass: "",
      batch: "",
      year: null,
      displayOrder: 0,
      featured: false,
      isPublished: false,
    },
  });

  const handleEdit = (item: any) => {
    setEditing(item);
    form.reset({
      studentName: item.studentName,
      message: item.message,
      designation: item.designation || "",
      studentClass: item.studentClass || "",
      batch: item.batch || "",
      year: item.year || null,
      displayOrder: item.displayOrder,
      featured: item.featured,
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    form.reset({
      studentName: "",
      message: "",
      designation: "",
      studentClass: "",
      batch: "",
      year: null,
      displayOrder: 0,
      featured: false,
      isPublished: false,
    });
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof testimonialSchema>) => {
    if (editing) {
      const r = await updateTestimonialAction(editing.id, data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    } else {
      const r = await createTestimonialAction(data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteTestimonialAction(id);
    if (r.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="size-4" /> Add Testimonial
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.studentName}</p>
                  {item.featured && (
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.studentClass}
                  {item.batch ? ` · ${item.batch}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  &ldquo;{item.message}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.isPublished ? (
                  <Eye className="size-4 text-green-600" />
                ) : (
                  <EyeOff className="size-4 text-muted-foreground" />
                )}
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Testimonial" : "Add Testimonial"}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Designation{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["IX", "X", "XI", "XII"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Batch <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Published</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <SubmitButton>{editing ? "Update" : "Create"}</SubmitButton>
          </form>
        </Form>
      </FormDialog>
    </div>
  );
}

// ── Gallery ──

function GalleryTab({ items }: { items: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const handleDelete = async (id: string) => {
    const r = await deleteGalleryItemAction(id);
    if (r.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Plus className="size-4" /> Add Image
      </Button>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item: any) => (
          <div key={item.id} className="group relative overflow-hidden rounded-lg border">
            <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-xs">
              {item.fileAsset?.mimeType || "Image"}
            </div>
            {item.caption && <p className="p-2 text-xs truncate">{item.caption}</p>}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="size-7"
                onClick={() => {
                  setEditing(item);
                  setOpen(true);
                }}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="size-7"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            {!item.isPublished && (
              <div className="absolute top-2 left-2 bg-muted-foreground text-background text-[10px] px-1.5 py-0.5 rounded">
                Draft
              </div>
            )}
          </div>
        ))}
      </div>
      <FormDialog open={open} onOpenChange={setOpen} title="Gallery Item">
        {editing ? (
          <GalleryEditForm
            item={editing}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Upload images via the file upload flow and associate them here. Full upload UI
            coming next.
          </p>
        )}
      </FormDialog>
    </div>
  );
}

function GalleryEditForm({ item, onDone }: { item: any; onDone: () => void }) {
  const [caption, setCaption] = useState(item.caption || "");
  const [category, setCategory] = useState(item.category || "");
  const [isPublished, setIsPublished] = useState(item.isPublished);
  const handleSave = async () => {
    const r = await updateGalleryItemAction(item.id, { caption, category, isPublished });
    if (r.success) {
      toast.success("Updated");
      onDone();
    } else {
      toast.error(r.error);
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Caption</label>
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        <label className="text-sm font-medium">Published</label>
      </div>
      <SubmitButton onClick={handleSave}>Save</SubmitButton>
    </div>
  );
}

// ── FAQ ──

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  category: z.string().optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

function FAQTab({ items }: { items: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const form = useForm<z.infer<typeof faqSchema>>({
    resolver: zodResolver(faqSchema) as any,
    defaultValues: {
      question: "",
      answer: "",
      category: "",
      displayOrder: 0,
      isPublished: false,
    },
  });

  const handleEdit = (item: any) => {
    setEditing(item);
    form.reset({
      question: item.question,
      answer: item.answer,
      category: item.category || "",
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    form.reset({
      question: "",
      answer: "",
      category: "",
      displayOrder: 0,
      isPublished: false,
    });
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof faqSchema>) => {
    if (editing) {
      const r = await updateFAQAction(editing.id, data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    } else {
      const r = await createFAQAction(data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deleteFAQAction(id);
    if (r.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="size-4" /> Add FAQ
      </Button>
      {items.map((item: any) => (
        <div key={item.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{item.question}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.answer}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.isPublished ? (
                <Eye className="size-4 text-green-600" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit FAQ" : "Add FAQ"}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write the answer…"
                      minHeight={180}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Category <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />
            <SubmitButton>{editing ? "Update" : "Create"}</SubmitButton>
          </form>
        </Form>
      </FormDialog>
    </div>
  );
}

// ── Performance Metrics ──

const metricSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  displayOrder: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(false),
});

function MetricsTab({ items }: { items: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const form = useForm<z.infer<typeof metricSchema>>({
    resolver: zodResolver(metricSchema) as any,
    defaultValues: { label: "", value: "", displayOrder: 0, isPublished: false },
  });

  const handleEdit = (item: any) => {
    setEditing(item);
    form.reset({
      label: item.label,
      value: item.value,
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    form.reset({ label: "", value: "", displayOrder: 0, isPublished: false });
    setOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof metricSchema>) => {
    if (editing) {
      const r = await updatePerformanceMetricAction(editing.id, data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    } else {
      const r = await createPerformanceMetricAction(data);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
    }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const r = await deletePerformanceMetricAction(id);
    if (r.success) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="size-4" /> Add Metric
      </Button>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <div className="mt-2 flex justify-center gap-1">
              {item.isPublished ? (
                <Eye className="size-4 text-green-600" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Metric" : "Add Metric"}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />
            <SubmitButton>{editing ? "Update" : "Create"}</SubmitButton>
          </form>
        </Form>
      </FormDialog>
    </div>
  );
}

// ── Shared FormDialog ──

function FormDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
