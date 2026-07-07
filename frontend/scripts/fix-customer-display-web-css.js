const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../../print-bridge/customer-display-web');

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'index.html') {
      fixCssInFile(filePath);
    }
  }
}

function fixCssInFile(filePath) {
  console.log(`Fixing CSS in: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix empty rulesets for stylesheet groups
  content = content.replace(/\[stylesheet-group="0"\]\{\}/g, '[stylesheet-group="0"]{outline:none}');
  content = content.replace(/\[stylesheet-group="1"\]\{\}/g, '[stylesheet-group="1"]{outline:none}');
  content = content.replace(/\[stylesheet-group="2"\]\{\}/g, '[stylesheet-group="2"]{outline:none}');
  content = content.replace(/\[stylesheet-group="2\.1"\]\{\}/g, '[stylesheet-group="2.1"]{outline:none}');
  content = content.replace(/\[stylesheet-group="2\.2"\]\{\}/g, '[stylesheet-group="2.2"]{outline:none}');
  content = content.replace(/\[stylesheet-group="3"\]\{\}/g, '[stylesheet-group="3"]{outline:none}');

  // 2. Fix appearance standard property compatibility
  content = content.replace(
    /-webkit-appearance:none;background-color/g,
    '-webkit-appearance:none;appearance:none;background-color'
  );

  // 3. Fix invalid border-curve property
  content = content.replace(/border-curve:continuous;/g, 'outline:none;');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully fixed CSS in: ${filePath}`);
}

processDirectory(targetDir);
