// read rtf text from ./temp.rtf and output to stdout as Uint8Array
import * as fs from "node:fs";
import * as path from "node:path";

const __dirname = import.meta.dirname;

function main() {
  const rtfPath = path.resolve(__dirname, "./temp.rtf");
  if (!fs.existsSync(rtfPath)) {
    console.error(`檔案不存在: ${rtfPath}`);
    process.exit(1);
  }
  const rtfBuffer = fs.readFileSync(rtfPath);
  const rtfString = rtfBuffer.toString("utf-8");
  const uint8Array = new TextEncoder().encode(rtfString);

  process.stdout.write("Uint8Array:\n\n[\n");
  for (let i = 0; i < uint8Array.length; i++) {
    process.stdout.write(uint8Array[i].toString());
    if (i < uint8Array.length - 1) {
      process.stdout.write(", ");
    }
  }
  process.stdout.write("\n]\n\nTotal length: " + uint8Array.length + "\n");
}

main();
