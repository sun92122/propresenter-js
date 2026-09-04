export default class RtfHelper {
  static parse(rtf: string | Uint8Array): string {
    const rtfString =
      typeof rtf === "string" ? rtf : new TextDecoder("utf-8").decode(rtf);
    // Remove RTF control words and groups
    const text = rtfString.replace(/\\[a-z]+\d* ?|{|}/g, "");
    return text;
  }
}
