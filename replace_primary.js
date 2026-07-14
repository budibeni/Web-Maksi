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
  'src/app/(main)/loading.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/blue-/g, 'orange-');
    fs.writeFileSync(f, content);
  }
});
console.log('Primary color updated to orange');
