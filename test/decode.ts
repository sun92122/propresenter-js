import * as fs from "node:fs";
import * as path from "node:path";

import * as ProPresenter from "../src/propresenter.js";
import RtfHelper from "../src/utils/RtfHelper.js";

import ProFileProcessor, { type ProFormat } from "../src/index.js";

const __dirname = import.meta.dirname;
const { Presentation } = ProPresenter.rv.data;

async function main() {
  // 取得傳入的所有參數（略過前兩項系統預設路徑）
  const args = process.argv.slice(2);

  // 取得第一個參數
  const param1 = args[0];

  const file = param1?.endsWith(".pro") ? param1 : (param1 || "test") + ".pro";
  const binaryPath = path.resolve(__dirname, file);
  if (!fs.existsSync(binaryPath)) {
    console.error(`檔案不存在: ${binaryPath}`);
    process.exit(1);
  }
  const binaryBuffer = fs.readFileSync(binaryPath);
  const presentation = Presentation.decode(binaryBuffer);
  console.error("解析成功");

  const processor = new ProFileProcessor();
  processor.setPresentation(presentation);
  const proFormat = processor.getProFormat();
  if (!proFormat) {
    console.error("無法取得 ProFormat");
    process.exit(1);
  }

  const jsonPath = path.resolve(
    __dirname,
    "decoded_out",
    proFormat.name + ".json",
  );
  // check if the directory exists, if not, create it
  const dirPath = path.dirname(jsonPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const proFormatCopy: any = JSON.parse(JSON.stringify(proFormat));

  for (const slide of proFormatCopy?.slides) {
    for (const element of slide?.elements) {
      if (element.textRtf) {
        console.log(
          `解析 slide: ${slide.uuid}, element: ${element.name}, textRtf: ${element.textRtf.data}`,
        );
        element.textRtf = RtfHelper.parse(element.textRtf.data as Uint8Array);
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(proFormatCopy, null, 2));
  console.log(`已將二進制檔案解碼為 ProFormat JSON 檔案: ${jsonPath}`);
}

main().catch((err) => {
  console.error("解析失敗:", err);
  process.exit(1);
});
