const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', 'utf8');

if (!content.includes('import {') || !content.includes('@prisma/client')) {
  // Add Prisma import
  content = content.replace(
    /import \{ useState \} from "react";/,
    `import { useState } from "react";\nimport { HomepageSection, WhyChooseUsItem, MethodologyStep, Testimonial, GalleryItem, FAQ, PerformanceMetric } from "@prisma/client";`
  );
}

// Replace in props definition
content = content.replace(/whyChooseUsItems: any\[\];/g, 'whyChooseUsItems: WhyChooseUsItem[];');
content = content.replace(/methodologySteps: any\[\];/g, 'methodologySteps: MethodologyStep[];');
content = content.replace(/testimonials: any\[\];/g, 'testimonials: Testimonial[];');
content = content.replace(/galleryItems: any\[\];/g, 'galleryItems: GalleryItem[];');
content = content.replace(/faqs: any\[\];/g, 'faqs: FAQ[];');
content = content.replace(/performanceMetrics: any\[\];/g, 'performanceMetrics: PerformanceMetric[];');
content = content.replace(/sections: any\[\];/g, 'sections: HomepageSection[];');

// Replace function signatures and states
content = content.replace(/function HomepageSectionsTab\(\{ sections \}: \{ sections: any\[\] \}\)/g, 'function HomepageSectionsTab({ sections }: { sections: HomepageSection[] })');
content = content.replace(/\(s: any\)/g, '(s: HomepageSection)');

content = content.replace(/function WhyChooseUsTab\(\{ items \}: \{ items: any\[\] \}\)/g, 'function WhyChooseUsTab({ items }: { items: WhyChooseUsItem[] })');
content = content.replace(/useState<any>\(null\); \/\/ TODO fix generic/g, 'useState<any>(null);'); // We will fix them individually below
content = content.replace(/WhyChooseUsTab.*?useState<any>\(null\)/gs, (match) => match.replace('useState<any>(null)', 'useState<WhyChooseUsItem | null>(null)'));
content = content.replace(/handleEdit = \(item: any\)/g, 'handleEdit = (item: any)'); // Will fix later using python if regex is too hard

fs.writeFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', content);
