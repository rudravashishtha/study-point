const fs = require('fs');

// 1. Fix DomainErrorCode imports
const actions = [
  'src/app/admin/batches/actions.ts',
  'src/app/admin/fee-assignments/actions.ts',
  'src/app/admin/homework/actions.ts',
  'src/app/admin/materials/actions.ts',
  'src/app/admin/tests/actions.ts'
];

for (const file of actions) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ DomainError \} from "@\/lib\/domain\/errors";/, 'import { DomainError, type DomainErrorCode } from "@/lib/domain/errors";');
  fs.writeFileSync(file, content);
}

// 2. Fix actions.ts indexing
let websiteActions = fs.readFileSync('src/app/admin/website/actions.ts', 'utf8');
websiteActions = websiteActions.replace(/const clean: Prisma.TestimonialUpdateInput = \{\};/, 'const clean: Record<string, unknown> = {};');
websiteActions = websiteActions.replace(/data: clean /, 'data: clean as Prisma.TestimonialUpdateInput ');
fs.writeFileSync('src/app/admin/website/actions.ts', websiteActions);

// 3. Fix WebsiteContentClient.tsx studentClass cast
let websiteClient = fs.readFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', 'utf8');
websiteClient = websiteClient.replace(/studentClass: values.studentClass,/g, 'studentClass: values.studentClass as ClassLevel,');
fs.writeFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', websiteClient);

