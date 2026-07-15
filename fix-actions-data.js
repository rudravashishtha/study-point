const fs = require('fs');

let websiteClient = fs.readFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', 'utf8');

websiteClient = websiteClient.replace(/updateTestimonialAction\(editing.id, data\)/, 'updateTestimonialAction(editing.id, { ...data, studentClass: data.studentClass as ClassLevel | undefined })');
websiteClient = websiteClient.replace(/createTestimonialAction\(data\)/, 'createTestimonialAction({ ...data, studentClass: data.studentClass as ClassLevel | undefined })');

fs.writeFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', websiteClient);
