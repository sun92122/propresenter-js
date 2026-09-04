import { Buffer } from "node:buffer";
import type { Writer } from "protobufjs";
import * as ProPresenter from "../propresenter.js";
import type {
  PresentationType,
  CueType,
  ElementType,
  ProFormat,
  Arrangement,
  Group,
  Element,
  Slide,
  UUID,
} from "../type.js";
import { generateUUID } from "../type.js";

import { templateBase64 } from "../template.js";

const Presentation = ProPresenter.rv.data.Presentation;
const Cue = ProPresenter.rv.data.Cue;
const Element = ProPresenter.rv.data.Slide.Element;

const templateBinary = Buffer.from(templateBase64, "base64");
const template = Presentation.decode(templateBinary);

// get template

function newPresentation(): PresentationType {
  return Presentation.decode(templateBinary);
}

function newCue(): CueType {
  return Cue.decode(Cue.encode(template.cues[0]).finish());
}

function newElement(): ElementType {
  if (
    !template.cues[0].actions?.[0]?.slide?.presentation?.baseSlide?.elements
  ) {
    throw new Error("Template does not have elements");
  }
  return Element.decode(
    Element.encode(
      template.cues[0].actions[0].slide.presentation.baseSlide.elements[0],
    ).finish(),
  );
}

// parse functions

function getSelectedArrangement(
  presentation: PresentationType,
): Arrangement | undefined {
  if (!presentation.selectedArrangement) {
    return undefined;
  }
  const selectedUuid = presentation.selectedArrangement.string;
  const selectedArrangement = presentation.arrangements.find(
    (arrangement) => arrangement.uuid?.string === selectedUuid,
  );
  if (
    !selectedArrangement ||
    !selectedArrangement.name ||
    !selectedArrangement.uuid
  ) {
    return undefined;
  }
  return {
    name: selectedArrangement.name,
    uuid: (selectedArrangement.uuid?.string || generateUUID()) as UUID,
    groupUuids: [], // get groupUuids from presentation.arrangements if needed
  };
}

function getArrangements(presentation: PresentationType): Arrangement[] {
  return presentation.arrangements.map((arrangement) => ({
    name: arrangement.name || "",
    uuid: (arrangement.uuid?.string || generateUUID()) as UUID,
    groupUuids: (arrangement.groupIdentifiers as UUID[]) || [],
  }));
}

function getGroups(presentation: PresentationType): Group[] {
  return presentation.cueGroups.map((cueGroup) => ({
    name: cueGroup.group?.applicationGroupName || "",
    uuid: (cueGroup.group?.uuid?.string || generateUUID()) as UUID,
    color: cueGroup.group?.color
      ? {
          alpha: cueGroup.group.color.alpha || 1,
          red: cueGroup.group.color.red || 0,
          green: cueGroup.group.color.green || 0,
          blue: cueGroup.group.color.blue || 0,
        }
      : undefined,
    hotkey: cueGroup.group?.hotKey?.code
      ? (cueGroup.group.hotKey.code as number)
      : undefined,
    slideUuids:
      (cueGroup.cueIdentifiers?.map((cueId) => cueId.string) as UUID[]) || [],
  }));
}

function getSlides(presentation: PresentationType): Slide[] {
  return presentation.cues.map((cue) => ({
    uuid: (cue.uuid?.string as UUID) || generateUUID(),
    noteRtf:
      cue.actions?.[0]?.slide?.presentation?.notes?.rtfData || new Uint8Array(),
    elements:
      (cue.actions?.flatMap((action) => {
        if (!action.slide?.presentation?.baseSlide?.elements) {
          return [];
        }
        return action.slide.presentation.baseSlide.elements.map((element) => ({
          name: element.element?.name || "",
          textRtf: element.element?.text?.rtfData || new Uint8Array(),
          position: element.element?.bounds
            ? {
                x: element.element?.bounds.origin?.x,
                y: element.element?.bounds.origin?.y,
                width: element.element?.bounds.size?.width,
                height: element.element?.bounds.size?.height,
              }
            : undefined,
        }));
      }) as Element[]) || [],
  }));
}

// edit functions

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
  if (!arrangements || arrangements.length === 0) {
    presentation.arrangements = [];
    return;
  }
  presentation.arrangements = arrangements.map((arrangement) => ({
    name: arrangement.name,
    uuid: { string: arrangement.uuid },
  }));
}

function editGroups(presentation: PresentationType, groups: Group[]): void {
  if (!groups || groups.length === 0) {
    presentation.cueGroups = [];
    return;
  }
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

function editSlides(presentation: PresentationType, slides: Slide[]): void {
  const cues: CueType[] = [];
  for (const slide of slides) {
    const cue = newCue();
    cue.uuid = { string: slide.uuid };
    const presentationSlide = cue.actions?.[0]?.slide?.presentation;
    presentationSlide!.notes!.rtfData = slide?.noteRtf || new Uint8Array();
    presentationSlide!.baseSlide!.elements = slide.elements.map((element) => {
      const tempElement = newElement();
      tempElement.element!.name = element.name;
      tempElement.element!.text!.rtfData = element.textRtf || new Uint8Array();
      if (element.bounds) {
        tempElement.element!.bounds = {
          origin: { x: element.bounds.x, y: element.bounds.y },
          size: {
            width: element.bounds.width,
            height: element.bounds.height,
          },
        };
      }
      return tempElement;
    });
    cues.push(cue);
  }
  presentation.cues = cues;
}

// main functions

function ProFormatToPresentation(proFormat: ProFormat): PresentationType {
  const presentation = newPresentation();
  // metadata
  editName(presentation, proFormat.name);
  editNote(presentation, proFormat.note);
  if (proFormat.selectedArrangement?.uuid) {
    editSelectedArrangement(presentation, proFormat.selectedArrangement?.uuid);
  }
  editArrangements(presentation, proFormat.arrangements || []);
  editGroups(presentation, proFormat.groups || []);
  // slides
  editSlides(presentation, proFormat.slides || []);

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
  editGroups(presentation, proFormat.groups || []);
}

function PresentationToProFormat(presentation: PresentationType): ProFormat {
  const proFormat: ProFormat = {
    name: presentation.name,
    note: presentation.notes,
    selectedArrangement: getSelectedArrangement(presentation),
    arrangements: getArrangements(presentation),
    groups: getGroups(presentation),
    slides: getSlides(presentation),
  };

  console.log(`[decodePresentationToProFormat] 解碼完成: ${proFormat.name}`);
  console.log(proFormat);
  return proFormat;
}

function PresentationToWriter(presentation: PresentationType): Writer {
  const writer = Presentation.encode(presentation);
  return writer;
}

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
};
