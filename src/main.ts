// Main entry point for the ProPresenter RTF processing library
// 1. encode: 將純文字轉為 RTF 二進制
// in: ProFormat, out: Uint8Array
// 2. decode: 將 RTF 二進制轉為純文字
// in: Uint8Array, out: ProFormat
import type {
  ProFormat,
  Group,
  Arrangement,
  Element,
  Slide,
  UUID,
} from "./type";

import { generateUUID } from "./type";

import { RtfHelper } from "./utils/RtfHelper";

import {
  ProFormatToPresentation,
  ProFormatUpdatePresentation,
  PresentationToProFormat,
  editName,
  editNote,
  editSelectedArrangement,
  editArrangements,
  editGroups,
} from "./utils/ProFormatter";

export default class ProFileProcessor {
    constructor() {
        // 初始化
    }

}

// export all
export {
  ProFormatToPresentation,
  ProFormatUpdatePresentation,
  PresentationToProFormat,
  editName,
  editNote,
  editSelectedArrangement,
  editArrangements,
  RtfHelper,
  generateUUID,
};

export type { ProFormat, Group, Arrangement, Element, Slide, UUID };
