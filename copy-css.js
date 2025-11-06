// copy-css.js
import fs from "fs";
import path from "path";

const srcDir = path.resolve("src/css");
const destDir = path.resolve("css");

if (!fs.existsSync(destDir)) {
	fs.mkdirSync(destDir);
}

for (const file of fs.readdirSync(srcDir)) {
	const srcPath = path.join(srcDir, file);
	const destPath = path.join(destDir, file);
	fs.copyFileSync(srcPath, destPath);
	console.log(`✅ Copied ${file}`);
}
