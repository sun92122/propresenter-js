// read ../template.pro gen ../template.ts

import * as fs from "node:fs";
import * as path from "node:path";

const __dirname = import.meta.dirname;

generateTemplate();

function generateTemplate() {
  const templatePath = path.resolve(__dirname, "../template.pro");
  if (!fs.existsSync(templatePath)) {
    console.error(`檔案不存在: ${templatePath}`);
    process.exit(1);
  }
  const templateBuffer = fs.readFileSync(templatePath);
  const templateBase64 = templateBuffer.toString("base64");

  const outputPath = path.resolve(__dirname, "../template.ts");
  const outputContent = `// This file is auto-generated from template.pro
export const templateBase64 = "${templateBase64}";
`;
  fs.writeFileSync(outputPath, outputContent);
  console.log(`已生成模板文件: ${outputPath}`);
}
