for file in src/components/admin/data-list/*.tsx src/components/layout/*.tsx src/components/feedback/*.tsx src/components/upload/*.tsx; do
  basename=$(basename $file .tsx)
  # search for usages of the component in src/ excluding the component file itself
  count=$(grep -r -l "$basename" src/ | grep -v "$file" | wc -l | tr -d ' ')
  echo "$basename: $count"
done
