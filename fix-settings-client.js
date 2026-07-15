const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/app/admin/settings/SettingsPageClient.tsx', 'utf8');

// Replace { field }: any => { field }
content = content.replace(/\{ field \}: any/g, '{ field }');

// Add import UseFormReturn
if (!content.includes('UseFormReturn')) {
  content = content.replace(/import \{ useForm \} from "react-hook-form";/, 'import { useForm, UseFormReturn } from "react-hook-form";');
}

// Replace { form }: { form: any } with { form }: { form: UseFormReturn<z.infer<typeof siteSettingsSchema>> }
content = content.replace(/\{ form \}: \{ form: any \}/g, '{ form }: { form: UseFormReturn<z.infer<typeof siteSettingsSchema>> }');

// Replace { settings }: { settings: any } with { settings }: { settings: z.infer<typeof siteSettingsSchema> }
content = content.replace(/\{ settings \}: \{ settings: any \}/g, '{ settings }: { settings: z.infer<typeof siteSettingsSchema> }');

fs.writeFileSync('src/app/admin/settings/SettingsPageClient.tsx', content);
