import * as fs from "node:fs";
import * as path from "node:path";
import ProFileProcessor, { type ProFormat } from "../src/index.js";

const __dirname = import.meta.dirname;

async function testEncode() {
  const args = process.argv.slice(2);
  const param1 = args[0];

  const file = param1?.endsWith(".json")
    ? param1
    : (param1 || "test") + ".json";
  const jsonPath = path.resolve(__dirname, file);
  if (!fs.existsSync(jsonPath)) {
    console.error(`檔案不存在: ${jsonPath}`);
    process.exit(1);
  }
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const proFormat = jsonData as ProFormat;

  const processor = new ProFileProcessor();
  processor.setProFormat(proFormat);
  const presentation = processor.getPresentation();
  if (!presentation) {
    console.error("無法取得 Presentation");
    process.exit(1);
  }

  const binaryBuffer = processor.getBinaryBuffer();
  if (!binaryBuffer) {
    console.error("無法取得二進制緩衝區");
    process.exit(1);
  }
  const binaryPath = path.resolve(
    __dirname,
    "encoded_out",
    proFormat.name + ".pro",
  );
  // check if the directory exists, if not, create it
  const dirPath = path.dirname(binaryPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(binaryPath, binaryBuffer);
  console.log(`已將 ProFormat 編碼為二進制檔案: ${binaryPath}`);
}

testEncode().catch((error) => {
  console.error("測試過程中發生錯誤:", error);
});
