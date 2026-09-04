import ProFileProcessor from "../src/index";
import { type ProFormat } from "../src/index";

async function testEncode() {
  const args = process.argv.slice(2);
  const param1 = args[0];

  const file = param1?.endsWith(".json")
    ? param1
    : (param1 || "test") + ".json";
  const jsonPath = require("path").resolve(__dirname, file);
  if (!require("fs").existsSync(jsonPath)) {
    console.error(`檔案不存在: ${jsonPath}`);
    process.exit(1);
  }
  const jsonData = require(jsonPath);
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
  const binaryPath = require("path").resolve(
    __dirname,
    "encoded_out",
    proFormat.name + ".pro",
  );
  // check if the directory exists, if not, create it
  const dirPath = require("path").dirname(binaryPath);
  if (!require("fs").existsSync(dirPath)) {
    require("fs").mkdirSync(dirPath, { recursive: true });
  }
  require("fs").writeFileSync(binaryPath, binaryBuffer);
  console.log(`已將 ProFormat 編碼為二進制檔案: ${binaryPath}`);
}

testEncode().catch((error) => {
  console.error("測試過程中發生錯誤:", error);
});
