import fs from "fs";
import path from "path";

const srcDir = path.resolve("src/css");
const outFile = path.resolve("styles.css");

let merged = "";
for (const file of fs.readdirSync(srcDir)) {
  if (file.endsWith(".css")) {
    merged += `/* ${file} */\n` + fs.readFileSync(path.join(srcDir, file), "utf8") + "\n\n";
  }
}

fs.writeFileSync(outFile, merged);
console.log("✅ Merged all CSS into styles.css");
