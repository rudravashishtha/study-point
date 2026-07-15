const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', 'utf8');

// Replace { field }: any => { field }
content = content.replace(/\{ field \}: any/g, '{ field }');

// Replace resolver: zodResolver(...) as any => resolver: zodResolver(...)
content = content.replace(/resolver: zodResolver\((.*?)\) as any/g, 'resolver: zodResolver($1)');

// Replace useState<any>(null) => useState<any>(null) wait... we can change it to specific types
// But we can just use Partial<z.infer<...>>
content = content.replace(/const \[editing, setEditing\] = useState<any>\(null\);/g, 'const [editing, setEditing] = useState<any>(null); // TODO fix generic');

fs.writeFileSync('src/app/admin/website/components/WebsiteContentClient.tsx', content);
