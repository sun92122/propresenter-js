import * as fs from "fs";
import * as path from "path";

import * as ProPresenter from "../src/propresenter";
import { RtfHelper } from "../src/utils/RtfHelper";

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
  console.error("解析成功:", presentation);

  console.log(
    `\n---------------------------\nPresentation: ${presentation.name}`,
  );
  console.log(`Cues: ${presentation.cues.length}`);
  console.log(`Notes: ${presentation.notes}`);
  console.log(`Category: ${presentation.category}`);
  console.log(
    `Arrangement selected: ${presentation.selectedArrangement?.string || "無"}`,
  );
  for (const arrangement of presentation.arrangements) {
    console.log(
      `Arrangement: ${arrangement.name}, uuid: ${arrangement.uuid?.string}`,
    );
  }

  for (const group of presentation.cueGroups) {
    console.log(
      `\n---------------------------\nCueGroup: ${group.group?.applicationGroupIdentifier?.string}, ${group.group?.applicationGroupName}, ${group.group?.color?.alpha}, ${group.group?.color?.red}, ${group.group?.color?.green}, ${group.group?.color?.blue}, ${group.group?.uuid?.string}, ${group.group?.hotKey?.code}, ${group.group?.hotKey?.controlIdentifier}, ${group.group?.name}`,
    );
    group.cueIdentifiers?.forEach((cueId) => {
      console.log(`Cue Identifier: ${cueId.string}`);
    });
  }

  for (const cue of presentation.cues) {
    if (!cue.actions) {
      console.log(`\n---------------------------\nCue ${cue.name} 沒有動作`);
      continue;
    }
    console.log(`\n---------------------------\nCue ${cue.name}:`);
    for (const action of cue.actions) {
      console.log(`動作: ${action.uuid?.string}, 類型: ${action.type}`);
      for (const element of action.slide?.presentation?.baseSlide?.elements ||
        []) {
        const elementTemp = element.element;
        const name = elementTemp?.name || "無名稱";
        const rtf = elementTemp?.text?.rtfData || new Uint8Array();
        const rtfString = new TextDecoder("utf-8").decode(rtf);
        const text = RtfHelper.parse(rtfString);
        console.log(`元素: ${name}\n`, `文字: ${JSON.stringify(text)}\n`);
      }
    }
  }
}

main().catch((err) => {
  console.error("解析失敗:", err);
  process.exit(1);
});
