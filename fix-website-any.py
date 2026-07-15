with open('src/app/admin/website/components/WebsiteContentClient.tsx', 'r') as f:
    code = f.read()

components = [
    ('WhyChooseUsTab', 'WhyChooseUsItem'),
    ('MethodologyTab', 'MethodologyStep'),
    ('TestimonialsTab', 'Testimonial'),
    ('GalleryTab', 'GalleryItem'),
    ('FAQTab', 'FAQ'),
    ('MetricsTab', 'PerformanceMetric')
]

for func, typ in components:
    code = code.replace(f'function {func}({{ items }}: {{ items: any[] }})', f'function {func}({{ items }}: {{ items: {typ}[] }})')
    code = code.replace(f'function {func}({{ steps }}: {{ steps: any[] }})', f'function {func}({{ steps }}: {{ steps: {typ}[] }})')
    
    start_idx = code.find(f'function {func}(')
    if start_idx != -1:
        end_idx = code.find('\\nfunction ', start_idx + 1)
        if end_idx == -1:
            end_idx = len(code)
            
        body = code[start_idx:end_idx]
        body = body.replace('useState<any>(null)', f'useState<{typ} | null>(null)')
        body = body.replace('handleEdit = (item: any)', f'handleEdit = (item: {typ})')
        body = body.replace('.map((item: any)', f'.map((item: {typ})')
        body = body.replace('.map((step: any)', f'.map((step: {typ})')
        
        code = code[:start_idx] + body + code[end_idx:]

code = code.replace('GalleryEditForm({ item, onDone }: { item: any; onDone: () => void })', 'GalleryEditForm({ item, onDone }: { item: GalleryItem; onDone: () => void })')

with open('src/app/admin/website/components/WebsiteContentClient.tsx', 'w') as f:
    f.write(code)

