const fs = require('fs');

const files = [
  'src/features/academic-sessions/components/SessionFormDialog.tsx',
  'src/features/homework/components/HomeworkFormDialog.tsx',
  'src/features/homework/components/HomeworkList.tsx',
  'src/features/homework/components/TeacherHomeworkFormDialog.tsx',
  'src/features/homework/components/TeacherHomeworkList.tsx',
  'src/features/materials/components/MaterialFormDialog.tsx',
  'src/features/materials/components/MaterialList.tsx',
  'src/features/materials/components/TeacherMaterialFormDialog.tsx',
  'src/features/materials/components/TeacherMaterialList.tsx',
  'src/features/tests/components/TestFormDialog.tsx',
  'src/features/tests/components/TestList.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix actionArgs as any
  content = content.replace(/actionArgs as any/g, 'actionArgs as Parameters<typeof sessionAction>[0]');
  
  // Fix (res.error as any)?.message
  content = content.replace(/\(res\.error as any\)\?\.message/g, '(res.error instanceof Error ? res.error.message : typeof res.error === "object" && res.error && "message" in res.error ? String(res.error.message) : "Unknown error")');
  
  // Fix error?: any
  content = content.replace(/error\?: any/g, 'error?: unknown');
  
  fs.writeFileSync(file, content);
}
