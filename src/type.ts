// Main entry point for the ProPresenter RTF processing library
// 1. encode: 將純文字轉為 RTF 二進制
// in: ProFormat, out: Uint8Array
// 2. decode: 將 RTF 二進制轉為純文字
// in: Uint8Array, out: ProFormat

import { type UUID } from "crypto";

interface Color {
  alpha: number;
  red: number;
  green: number;
  blue: number;
}

interface Position {
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
  text: string;
  position?: Position;
}

interface Slide {
  note: string;
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
  return crypto.randomUUID() as UUID;
}

export type { ProFormat, Group, Arrangement, Element, Slide, UUID };
