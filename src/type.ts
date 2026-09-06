// Main entry point for the ProPresenter RTF processing library
// 1. encode: 將純文字轉為 RTF 二進制
// in: ProFormat, out: Uint8Array
// 2. decode: 將 RTF 二進制轉為純文字
// in: Uint8Array, out: ProFormat

import { randomUUID, type UUID } from "node:crypto";
import * as ProPresenter from "./propresenter.js";

type PresentationType = typeof ProPresenter.rv.data.Presentation.prototype;
type CueType = typeof ProPresenter.rv.data.Cue.prototype;
type ActionType = typeof ProPresenter.rv.data.Action.prototype;
type SlideType = typeof ProPresenter.rv.data.Slide.prototype;
type ElementType = typeof ProPresenter.rv.data.Slide.Element.prototype;

interface Color {
  alpha: number;
  red: number;
  green: number;
  blue: number;
}

interface Bounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

enum Hotkey {
  A = 1,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
}

enum VerticalAlignment {
  Top = 0,
  Middle = 1,
  Bottom = 2,
}

interface Group {
  name: string;
  uuid: UUID;
  color?: Color;
  hotkey?: Hotkey;
  slideUuids: UUID[];
}

interface Arrangement {
  name: string;
  uuid: UUID;
  groupUuids: UUID[];
}

interface Element {
  name: string;
  textRtf: Uint8Array;
  align?: VerticalAlignment;
  bounds?: Bounds;
}

interface Slide {
  uuid: UUID;
  noteRtf?: Uint8Array;
  elements: Element[];
}

interface ProFormat {
  name: string;
  note: string;
  selectedArrangement?: Arrangement;
  arrangements: Arrangement[];
  groups: Group[];
  slides: Slide[];
}

export function generateUUID(): UUID {
  // 生成一個隨機的 UUID（版本 4）
  return randomUUID() as UUID;
}

export type {
  PresentationType,
  CueType,
  ActionType,
  SlideType,
  ElementType,
  Color,
  ProFormat,
  Group,
  Arrangement,
  Element,
  Slide,
  UUID,
};
