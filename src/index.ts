// Main entry point for the ProPresenter RTF processing library
// 1. encode: 將純文字轉為 RTF 二進制
// in: ProFormat, out: Uint8Array
// 2. decode: 將 RTF 二進制轉為純文字
// in: Uint8Array, out: ProFormat
import type {
  PresentationType,
  ProFormat,
  Group,
  Arrangement,
  Element,
  Slide,
  UUID,
} from "./type.js";

import { generateUUID } from "./type.js";

import {
  ProFormatToPresentation,
  ProFormatUpdatePresentation,
  PresentationToProFormat,
  PresentationToWriter,
  editName,
  editNote,
  editSelectedArrangement,
  editArrangements,
  editGroups,
} from "./utils/ProFormatter.js";

import RtfHelper from "./utils/RtfHelper.js";

export default class ProFileProcessor {
  presentation: PresentationType | null;
  proFormat: ProFormat | null;

  constructor() {
    this.presentation = null;
    this.proFormat = null;
  }

  setPresentation(presentation: PresentationType): void {
    this.presentation = presentation;
    this.proFormat = PresentationToProFormat(presentation);
  }

  setProFormat(proFormat: ProFormat): void {
    this.proFormat = proFormat;
  }

  getPresentation(): PresentationType | null {
    if (this.presentation) {
      ProFormatUpdatePresentation(this.presentation, this.proFormat!);
    } else {
      if (this.proFormat) {
        this.presentation = ProFormatToPresentation(this.proFormat);
      }
    }
    return this.presentation;
  }

  getProFormat(): ProFormat | null {
    return this.proFormat;
  }

  getBinaryBuffer(): Uint8Array | null {
    this.getPresentation(); // 確保 presentation 已更新
    if (this.presentation) {
      const writer = PresentationToWriter(this.presentation);
      return writer.finish();
    }
    return null;
  }
}

// export all
export {
  ProFormatToPresentation,
  ProFormatUpdatePresentation,
  PresentationToProFormat,
  PresentationToWriter,
  editName,
  editNote,
  editSelectedArrangement,
  editArrangements,
  editGroups,
  generateUUID,
  RtfHelper,
};

export type { PresentationType, ProFormat, Group, Arrangement, Element, Slide, UUID };
