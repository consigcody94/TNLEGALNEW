#!/usr/bin/env python3
import re
import os

# Read the header template from index.html
with open('/tmp/header_template.html', 'r', encoding='utf-8') as f:
    header_template = f.read()

# List of HTML files to update (all except index.html)
html_files = [
    'about.html',
    'services.html',
    'news.html',
    'article.html',
    'online-services.html',
    'notary-request.html',
    'contact.html',
    'privacy.html',
    'disclaimer.html'
]

# Process each HTML file
for filename in html_files:
    if not os.path.exists(filename):
        print(f"Skipping {filename} (not found)")
        continue

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace the entire header section with the template from index.html
    # This pattern matches from <header to </header> inclusively
    pattern = r'<header[^>]*>.*?</header>'
    new_content = re.sub(pattern, header_template, content, flags=re.DOTALL)

    # Write back
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"✓ Updated {filename}")

print("\nAll headers replaced with index.html header!")
