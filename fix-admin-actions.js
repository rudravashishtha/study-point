const fs = require('fs');
const path = require('path');

const files = [
  'src/app/admin/batches/actions.ts',
  'src/app/admin/fee-assignments/actions.ts',
  'src/app/admin/homework/actions.ts',
  'src/app/admin/materials/actions.ts',
  'src/app/admin/tests/actions.ts'
];

for (const file of files) {
  const p = path.resolve(file);
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace `(res.error?.code as any)` and `(result.error?.code as any)`
  content = content.replace(/\(\(res\.error\?\.code as any\) \|\|/g, '((res.error?.code as DomainErrorCode) ||');
  content = content.replace(/\(\(result\.error\?\.code as any\) \|\|/g, '((result.error?.code as DomainErrorCode) ||');

  // Add import if not present
  if (!content.includes('DomainErrorCode')) {
    content = content.replace(/import \{ DomainError \} from "@\/lib\/domain\/errors";/, 'import { DomainError, type DomainErrorCode } from "@/lib/domain/errors";');
  }

  fs.writeFileSync(p, content);
  console.log('Fixed', file);
}
