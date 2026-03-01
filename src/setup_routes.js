const fs = require('fs');
const path = require('path');

try {
  const dirs = [
    'src/app/login',
    'src/app/(dashboard)/inventory',
    'src/app/(dashboard)/orders',
    'src/app/(dashboard)/reports',
    'src/app/(dashboard)/settings',
    'src/app/(dashboard)/users'
  ];

  dirs.forEach(d => {
    fs.mkdirSync(path.join(__dirname, '..', d), { recursive: true });
    console.log("Created directory " + d);
  });

  const files = [
    { src: 'pages/Login.jsx', dest: 'src/app/login/page.jsx' },
    { src: 'pages/Dashboard.jsx', dest: 'src/app/(dashboard)/page.jsx' },
    { src: 'pages/Inventory.jsx', dest: 'src/app/(dashboard)/inventory/page.jsx' },
    { src: 'pages/Orders.jsx', dest: 'src/app/(dashboard)/orders/page.jsx' },
    { src: 'pages/Reports.jsx', dest: 'src/app/(dashboard)/reports/page.jsx' },
    { src: 'pages/Settings.jsx', dest: 'src/app/(dashboard)/settings/page.jsx' },
    { src: 'pages/UserManagement.jsx', dest: 'src/app/(dashboard)/users/page.jsx' }
  ];

  files.forEach(f => {
    const s = path.join(__dirname, '..', 'src', f.src);
    const d = path.join(__dirname, '..', f.dest);
    if (fs.existsSync(s)) {
      fs.renameSync(s, d);
      console.log("Moved " + f.src + " to " + f.dest);
    } else {
      console.log("Not found: " + s);
    }
  });
  
  const pagesDir = path.join(__dirname, '..', 'src/pages');
  if (fs.existsSync(pagesDir)) {
      fs.rmdirSync(pagesDir);
      console.log("Removed src/pages");
  }

} catch (e) {
  console.error(e);
}
