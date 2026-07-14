const fs = require('fs');
const files = [
  'src/components/layout/Header.jsx',
  'src/components/layout/Sidebar.jsx',
  'src/components/layout/Breadcrumb.jsx',
  'src/app/(main)/layout.js',
  'src/app/(main)/dashboard/page.js',
  'src/app/login/page.js',
  'src/app/error.js',
  'src/app/not-found.js',
  'src/app/(main)/loading.js',
  'src/app/globals.css',
  'src/app/layout.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/gray-/g, 'neutral-');
    fs.writeFileSync(f, content);
  }
});
console.log('Colors updated to neutral');
