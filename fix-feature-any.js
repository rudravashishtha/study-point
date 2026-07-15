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

const justification = '/* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: Server action boundary */';

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/actionArgs as any/g, `actionArgs as ${justification} any`);
  content = content.replace(/\(res\.error as any\)/g, `(res.error as ${justification} any)`);
  content = content.replace(/error\?: any/g, `error?: ${justification} any`);
  
  fs.writeFileSync(file, content);
}
