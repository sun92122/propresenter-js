export default class RtfHelper {
  static parse(rtf: string | Uint8Array): string {
    const rtfString = typeof rtf === "string" ? rtf : uint8ArrayToString(rtf);
    // Remove RTF control words and groups
    // const text = rtfString.replace(/\\[a-z]+\d* ?|{|}/g, "");
    const text = rtfString;
    return text;
  }
}

function uint8ArrayToString(uint8Array: Uint8Array): string {
  let result = "";
  for (let i = 0; i < uint8Array.length; i++) {
    result += String.fromCharCode(uint8Array[i]);
  }
  return result;
}
