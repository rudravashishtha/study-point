"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/ui/submit-button";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/layout/page-header";
import { updateSiteSettingsAction } from "./actions";

const TABS = [
  { id: "institute", label: "Institute" },
  { id: "homepage", label: "Homepage" },
  { id: "branding", label: "Branding" },
  { id: "admissions", label: "Admissions" },
  { id: "resources", label: "Resources" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const settingsSchema = z.object({
  instituteName: z.string().min(1, "Required").max(100),
  tagline: z.string().max(200).nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().max(500).nullable().optional(),
  landmark: z.string().max(200).nullable().optional(),
  mapUrl: z.string().nullable().optional(),
  openingHours: z.string().max(200).nullable().optional(),
  heroHeadline: z.string().max(120).nullable().optional(),
  heroSubheadline: z.string().max(300).nullable().optional(),
  heroCtaText: z.string().max(50).nullable().optional(),
  heroCtaTarget: z.string().nullable().optional(),
  defaultTitle: z.string().max(100).nullable().optional(),
  defaultDescription: z.string().max(300).nullable().optional(),
  feeDisplayEnabled: z.boolean(),
  admissionsOpen: z.boolean(),
  resourcesEnabled: z.boolean(),
  resourcesSearchEnabled: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsPageClient(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: settings payload */ { settings }: { settings: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("institute");
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      instituteName: settings.instituteName,
      tagline: settings.tagline || "",
      phone: settings.phone || "",
      whatsappNumber: settings.whatsappNumber || "",
      email: settings.email || "",
      address: settings.address || "",
      landmark: settings.landmark || "",
      mapUrl: settings.mapUrl || "",
      openingHours: settings.openingHours || "",
      heroHeadline: settings.heroHeadline || "",
      heroSubheadline: settings.heroSubheadline || "",
      heroCtaText: settings.heroCtaText || "",
      heroCtaTarget: settings.heroCtaTarget || "",
      defaultTitle: settings.defaultTitle || "",
      defaultDescription: settings.defaultDescription || "",
      feeDisplayEnabled: settings.feeDisplayEnabled,
      admissionsOpen: settings.admissionsOpen,
      resourcesEnabled: settings.resourcesEnabled,
      resourcesSearchEnabled: settings.resourcesSearchEnabled,
    },
  });

  const onSubmit = (data: SettingsValues) => {
    startTransition(async () => {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        clean[key] = value === "" ? null : value;
      }
      const result = await updateSiteSettingsAction(clean);
      if (result.success) {
        toast.success("Settings saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Settings</PageHeaderHeading>
          <PageHeaderDescription>
            Manage site-wide configuration.
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {activeTab === "institute" && <InstituteTab form={form} />}
          {activeTab === "homepage" && <HomepageTab form={form} />}
          {activeTab === "branding" && <BrandingTab form={form} />}
          {activeTab === "admissions" && <AdmissionsTab form={form} />}
          {activeTab === "resources" && <ResourcesTab form={form} />}
          <div className="flex justify-end border-t pt-4">
            <SubmitButton pending={isPending}>Save Changes</SubmitButton>
          </div>
        </form>
      </Form>
    </div>
  );
}

function InstituteTab(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: prop drilling complex RHF types */ { form }: { form: any }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField control={form.control} name="instituteName" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Institute Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="tagline" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Tagline</FormLabel>
          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="phone" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="whatsappNumber" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="email" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="openingHours" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem><FormLabel>Opening Hours</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="address" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Address</FormLabel>
          <FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="landmark" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Landmark</FormLabel>
          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="mapUrl" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Map URL</FormLabel>
          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
          <FormDescription>Google Maps embed URL</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
      <div className="sm:col-span-2 rounded-lg border p-4">
        <p className="text-sm font-medium mb-1">Logo</p>
        <p className="text-xs text-muted-foreground">Logo upload will use the shared file uploader in Phase 7.</p>
      </div>
    </div>
  );
}

function HomepageTab(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: prop drilling complex RHF types */ { form }: { form: any }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField control={form.control} name="heroHeadline" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Hero Headline</FormLabel>
          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="heroSubheadline" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Hero Subheadline</FormLabel>
          <FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="heroCtaText" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem><FormLabel>CTA Button Text</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="heroCtaTarget" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem><FormLabel>CTA Target URL</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );
}

function BrandingTab(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: prop drilling complex RHF types */ { form }: { form: any }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField control={form.control} name="defaultTitle" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Default Meta Title</FormLabel>
          <FormControl><Input {...field} value={field.value || ""} /></FormControl>
          <FormDescription>Used as fallback for pages without specific titles</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="defaultDescription" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Default Meta Description</FormLabel>
          <FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl>
          <FormDescription>Used as fallback for pages without specific descriptions</FormDescription>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function AdmissionsTab(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: prop drilling complex RHF types */ { form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormField control={form.control} name="admissionsOpen" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-base">Admissions Open</FormLabel>
            <p className="text-sm text-muted-foreground">Show admission-related content and CTAs on the website</p>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="feeDisplayEnabled" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-base">Fee Display</FormLabel>
            <p className="text-sm text-muted-foreground">Show fee information on the public website</p>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    </div>
  );
}

function ResourcesTab(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: prop drilling complex RHF types */ { form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormField control={form.control} name="resourcesEnabled" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-base">Public Resources</FormLabel>
            <p className="text-sm text-muted-foreground">Enable the public study resources section</p>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="resourcesSearchEnabled" render={(/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: react-hook-form render props are complex */ { field }: any) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <FormLabel className="text-base">Resources Search</FormLabel>
            <p className="text-sm text-muted-foreground">Enable search and filtering on the resources page</p>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    </div>
  );
}
