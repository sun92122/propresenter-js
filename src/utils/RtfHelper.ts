/**
 * 專為 ProPresenter 設計的 RTF 處理工具 (TypeScript)
 * 針對換行 (Line breaks / \par / \line) 與多位元組編碼完整優化
 */
export class RtfHelper {
  private static latin1Decoder = new TextDecoder("latin1");
  private static encoder = new TextEncoder();

  /**
   * 1. 將 Uint8Array 二進制轉為 RTF 原始碼字串
   */
  static bytesToRtf(bytes: Uint8Array): string {
    return this.latin1Decoder.decode(bytes);
  }

  /**
   * 2. 將 RTF 字串轉回 Uint8Array 二進制
   */
  static rtfToBytes(rtf: string): Uint8Array {
    return this.encoder.encode(rtf);
  }

  /**
   * 3. 解析 RTF 二進制，提取純文字（換行完整保留）
   * @param bytesOrString RTF 資料
   * @param options.preserveBoundaryNewlines 是否保留首尾的換行符號（預設 true）
   * @param options.raw 是否完全不做任何空白修剪（預設 false）
   */
  static extractPlainText(
    bytesOrString: Uint8Array | string,
    options: { preserveBoundaryNewlines?: boolean; raw?: boolean } = {},
  ): string {
    const { preserveBoundaryNewlines = true, raw = false } = options;
    const rawRtf =
      typeof bytesOrString === "string"
        ? bytesOrString
        : this.bytesToRtf(bytesOrString);

    const { text } = this.parseInternal(rawRtf);

    if (raw) return text;
    if (preserveBoundaryNewlines) {
      // 僅去除首尾水平空格與 Tab，保留使用者刻意保留的 \n 換行
      return text.replace(/^[ \t]+|[ \t]+$/g, "");
    }
    return text.trim();
  }

  /**
   * 4. 修改 RTF：保留 ProPresenter 原本的複雜樣式設定，僅無損更換文字內容（換行完整保留）
   */
  static replaceTextPreservingStyle(
    originalBytes: Uint8Array,
    newText: string,
  ): Uint8Array {
    const rawRtf = this.bytesToRtf(originalBytes);
    const { firstContentIndex, lastContentIndex } = this.parseInternal(rawRtf);

    // 將新文字安全編譯（換行 \n 自動轉為 \par\n）
    const escapedNewText = "\\uc0 " + this.escapeToRtfText(newText);

    let modifiedRtf: string;
    if (firstContentIndex !== -1 && lastContentIndex !== -1) {
      modifiedRtf =
        rawRtf.substring(0, firstContentIndex) +
        escapedNewText +
        rawRtf.substring(lastContentIndex);
    } else {
      const lastBraceIdx = rawRtf.lastIndexOf("}");
      if (lastBraceIdx !== -1) {
        modifiedRtf =
          rawRtf.substring(0, lastBraceIdx) +
          " " +
          escapedNewText +
          rawRtf.substring(lastBraceIdx);
      } else {
        modifiedRtf = rawRtf + escapedNewText;
      }
    }

    return this.rtfToBytes(modifiedRtf);
  }

  /**
   * 5. 生成 RTF：建立符合 ProPresenter 規範的投影片 RTF（支援多行文字）
   */
  static createRtf(
    text: string,
    options: {
      fontSize?: number; // 單位 pt
      fontName?: string;
      bold?: boolean;
      colorHex?: string;
    } = {},
  ): Uint8Array {
    const {
      fontSize = 48,
      fontName = "PingFangTC-Semibold",
      bold = true,
      colorHex = "#FFFFFF",
    } = options;

    const hex = colorHex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 255;
    const g = parseInt(hex.substring(2, 4), 16) || 255;
    const b = parseInt(hex.substring(4, 6), 16) || 255;

    const fs = fontSize * 2;
    const boldTag = bold ? "\\b" : "";
    const escapedText = this.escapeToRtfText(text);

    const template = `{\\rtf1\\ansi\\ansicpg950\\cocoartf2870
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset136 ${fontName};}
{\\colortbl;\\red255\\green255\\blue255;\\red${r}\\green${g}\\blue${b};}
{\\*\\expandedcolortbl;;\\csgenericrgb\\c${(r / 255).toFixed(5)}\\c${(g / 255).toFixed(5)}\\c${(b / 255).toFixed(5)};}
\\deftab1680
\\pard\\pardeftab1680\\qc\\partightenfactor0
\\f0${boldTag}\\fs${fs} \\cf2 \\uc0 ${escapedText}}`;

    return this.rtfToBytes(template);
  }

  /**
   * 內部核心狀態機解析器
   */
  private static parseInternal(rawRtf: string): {
    text: string;
    firstContentIndex: number;
    lastContentIndex: number;
  } {
    let encoding = "big5";
    const cpgMatch = rawRtf.match(/\\ansicpg(\d+)/);
    if (cpgMatch) {
      const cpg = cpgMatch[1];
      if (cpg === "950") encoding = "big5";
      else if (cpg === "936") encoding = "gbk";
      else if (cpg === "932") encoding = "shift-jis";
      else if (cpg === "1252") encoding = "windows-1252";
    }

    let cpgDecoder: TextDecoder;
    try {
      cpgDecoder = new TextDecoder(encoding);
    } catch {
      cpgDecoder = new TextDecoder("utf-8");
    }

    const result: string[] = [];
    let hexBuffer: number[] = [];
    let ucCount = 1;
    let skipCount = 0;
    const groupStack: boolean[] = [];
    let isIgnoredGroup = false;

    let firstContentIndex = -1;
    let lastContentIndex = -1;

    const flushHex = () => {
      if (hexBuffer.length > 0) {
        result.push(cpgDecoder.decode(new Uint8Array(hexBuffer)));
        hexBuffer = [];
      }
    };

    const markContent = (start: number, end: number) => {
      if (firstContentIndex === -1) {
        firstContentIndex = start;
      }
      lastContentIndex = end;
    };

    let i = 0;
    const len = rawRtf.length;

    while (i < len) {
      const char = rawRtf[i];

      // 群組判定
      if (char === "{") {
        flushHex();
        const lookahead = rawRtf.substring(i, i + 25);
        const shouldIgnore = /^{\\(\*|fonttbl|colortbl|stylesheet|info)/.test(
          lookahead,
        );
        groupStack.push(shouldIgnore || isIgnoredGroup);
        isIgnoredGroup = groupStack[groupStack.length - 1];
        i++;
        continue;
      }

      if (char === "}") {
        flushHex();
        if (groupStack.length > 0) groupStack.pop();
        isIgnoredGroup =
          groupStack.length > 0 ? groupStack[groupStack.length - 1] : false;
        i++;
        continue;
      }

      if (isIgnoredGroup) {
        i++;
        continue;
      }

      // 轉義與控制詞
      if (char === "\\") {
        // 1. \'xx 十六進位字節
        if (i + 1 < len && rawRtf[i + 1] === "'") {
          const hexStr = rawRtf.substring(i + 2, i + 4);
          if (/^[0-9a-fA-F]{2}$/.test(hexStr)) {
            if (skipCount > 0) {
              skipCount--;
            } else {
              hexBuffer.push(parseInt(hexStr, 16));
              markContent(i, i + 4);
            }
            i += 4;
            continue;
          }
        }

        flushHex();

        // 2. 特殊轉義符 \{, \}, \\
        if (
          i + 1 < len &&
          (rawRtf[i + 1] === "{" ||
            rawRtf[i + 1] === "}" ||
            rawRtf[i + 1] === "\\")
        ) {
          if (skipCount > 0) {
            skipCount--;
          } else {
            result.push(rawRtf[i + 1]);
            markContent(i, i + 2);
          }
          i += 2;
          continue;
        }

        // 3. 不換行空白 \~
        if (i + 1 < len && rawRtf[i + 1] === "~") {
          result.push(" ");
          markContent(i, i + 2);
          i += 2;
          continue;
        }

        // 4. 解析控制詞
        const ctrlMatch = rawRtf
          .substring(i + 1)
          .match(/^([a-zA-Z]+)(-?\d+)? ?/);
        if (ctrlMatch) {
          const fullLen = ctrlMatch[0].length;
          const word = ctrlMatch[1];
          const param = ctrlMatch[2];

          // 核心：完整保留換行符號（段落換行 \par、軟換行 \line / \softline）
          if (word === "par" || word === "line" || word === "softline") {
            result.push("\n");
            markContent(i, i + 1 + fullLen);
          } else if (word === "page" || word === "column") {
            result.push("\n\n");
            markContent(i, i + 1 + fullLen);
          } else if (word === "tab") {
            result.push("\t");
            markContent(i, i + 1 + fullLen);
          } else if (word === "uc") {
            ucCount = param !== undefined ? parseInt(param, 10) : 1;
          } else if (word === "u") {
            let code = param !== undefined ? parseInt(param, 10) : 0;
            if (code < 0) code += 65536;
            result.push(String.fromCharCode(code));
            skipCount = ucCount;
            markContent(i, i + 1 + fullLen);
          }

          i += 1 + fullLen;
          continue;
        }

        // 文字換行 (///n)
        if (i + 1 < len && rawRtf[i + 1] === "\n") {
          i += 2;
          result.push("\n");
          markContent(i - 2, i);
          continue;
        }

        i++;
        continue;
      }

      // 一般字元處理
      flushHex();

      // RTF 原始檔中的裸換行 (CRLF) 為排版雜訊，略過；真正的換行依據 \par 與 \line
      if (char === "\r" || char === "\n") {
        i++;
        continue;
      }

      if (skipCount > 0) {
        skipCount--;
      } else {
        result.push(char);
        markContent(i, i + 1);
      }
      i++;
    }

    flushHex();

    return {
      text: result.join(""),
      firstContentIndex,
      lastContentIndex,
    };
  }

  /**
   * 將包含換行的 Unicode 字串安全編譯為 RTF 內文格式
   * 自動將 \r\n, \r, \n 統一正規化，並編譯為標準 RTF 換行 \par\n
   */
  private static escapeToRtfText(text: string): string {
    // 關鍵：先統一所有平台的換行，避免 \r 被誤編碼為 Unicode \u13
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    let out = "";

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (char === "\n") {
        out += "\\par\n";
      } else if (char === "\t") {
        out += "\\tab ";
      } else if (char === "{") {
        out += "\\{";
      } else if (char === "}") {
        out += "\\}";
      } else if (char === "\\") {
        out += "\\\\";
      } else {
        const code = char.charCodeAt(0);
        if (code >= 32 && code <= 126) {
          out += char;
        } else {
          out += `\\u${code} `;
        }
      }
    }
    return out;
  }
}
