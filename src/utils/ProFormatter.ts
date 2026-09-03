import * as ProPresenter from "../propresenter";
import type {
  ProFormat,
  Arrangement,
  Group,
  Element,
  Slide,
  UUID,
} from "../type";
import { generateUUID } from "../type";
import { RtfHelper } from "./RtfHelper";

type PresentationType = typeof ProPresenter.rv.data.Presentation.prototype;
const Presentation = ProPresenter.rv.data.Presentation;

function editName(presentation: PresentationType, newName: string): void {
  presentation.name = newName;
}

function editNote(presentation: PresentationType, newNote: string): void {
  presentation.notes = newNote;
}

function editSelectedArrangement(
  presentation: PresentationType,
  arrangementUuid: UUID,
): void {
  presentation.selectedArrangement = { string: arrangementUuid };
}

function editArrangements(
  presentation: PresentationType,
  arrangements: Arrangement[],
): void {
  presentation.arrangements = arrangements.map((arrangement) => ({
    name: arrangement.name,
    uuid: { string: arrangement.uuid },
  }));
}

function editGroups(presentation: PresentationType, groups: Group[]): void {
  presentation.cueGroups = groups.map((group) => ({
    cueIdentifiers: group.slideUuids.map((uuid) => ({ string: uuid })),
    group: {
      name: group.name,
      color: group.color,
      uuid: { string: group.uuid },
      hotKey: { code: group.hotkey ? (group.hotkey as number) : 0 },
    },
  }));
}

function ProFormatToPresentation(proFormat: ProFormat): PresentationType {
  const presentation = Presentation.create();
  // metadata
  editName(presentation, proFormat.name);
  editNote(presentation, proFormat.note);
  if (proFormat.selectedArrangement?.uuid) {
    editSelectedArrangement(presentation, proFormat.selectedArrangement?.uuid);
  }
  editArrangements(presentation, proFormat.arrangements || []);
  editGroups(presentation, proFormat.groups || []);
  // slides
  proFormat.slides.forEach((slide) => {
    // Process each slide
  });

  return presentation;
}

function ProFormatUpdatePresentation(
  presentation: PresentationType,
  proFormat: ProFormat,
): void {
  editName(presentation, proFormat.name);
  editNote(presentation, proFormat.note);
  if (proFormat.selectedArrangement?.uuid) {
    editSelectedArrangement(presentation, proFormat.selectedArrangement?.uuid);
  }
  editArrangements(presentation, proFormat.arrangements || []);
}

function PresentationToProFormat(presentation: PresentationType): ProFormat {
  const proFormat: ProFormat = {
    name: presentation.name,
    note: presentation.notes,
    selectedArrangement: presentation.selectedArrangement
      ? ({
          name:
            presentation.arrangements.find(
              (arr) =>
                arr.uuid?.string === presentation.selectedArrangement?.string,
            )?.name || "",
          uuid: presentation.selectedArrangement.string,
          groupUuids: [],
        } as Arrangement)
      : undefined,
    arrangements: presentation.arrangements.map(
      (arrangement) =>
        ({
          name: arrangement.name,
          uuid: arrangement.uuid?.string || generateUUID(),
          groupUuids: arrangement.groupIdentifiers,
        }) as Arrangement,
    ),
    groups: [], // 目前未處理 groups，需根據實際需求進行解析
    slides: [], // 目前未處理 slides，需根據實際需求進行解析
  };

  console.log(`[decodePresentationToProFormat] 解碼完成: ${proFormat.name}`);
  console.log(proFormat);
  return proFormat;
}

export {
  ProFormatToPresentation,
  ProFormatUpdatePresentation,
  PresentationToProFormat,
  editName,
  editNote,
  editSelectedArrangement,
  editArrangements,
  editGroups,
};

function test() {
  const test = ProFormatToPresentation({
    name: "Test Presentation",
    note: "This is a test presentation",
    selectedArrangement: {
      name: "Arrangement 1",
      uuid: generateUUID(),
    },
    arrangements: [
      {
        name: "Arrangement 1",
        uuid: generateUUID(),
      },
    ],
  } as ProFormat);
  const fs = require("fs");
  const path = require("path");
  // save the test presentation to a binary file
  const binaryPath = path.resolve(__dirname, "test.pro");
  fs.writeFileSync(binaryPath, Presentation.encode(test).finish());
  console.log(`已將測試 Presentation 儲存至: ${binaryPath}`);
}

test();
