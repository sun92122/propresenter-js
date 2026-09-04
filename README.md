# propresenter-js

A modern JavaScript / TypeScript library for reading, manipulating, and writing ProPresenter 7 data (`.pro` presentation files).

## Features

- 📦 Native ES Module (ESM) with complete TypeScript type definitions (`.d.ts`).
- 🔄 Encode and decode ProPresenter 7 `.pro` protobuf files.
- 📝 Edit presentation name, notes, arrangements, groups, and slides.
- 🔤 RTF helper for parsing and converting slide text.

## Installation

```bash
npm install propresenter-js
# or
pnpm add propresenter-js
# or
yarn add propresenter-js
```

## Quick Start

### 1. Decoding a `.pro` File

```typescript
import * as fs from "node:fs";
import ProFileProcessor, { PresentationToProFormat } from "propresenter-js";
import * as ProPresenter from "propresenter-js/dist/propresenter.js";

const { Presentation } = ProPresenter.rv.data;

// Read binary buffer
const buffer = fs.readFileSync("sample.pro");

// Decode directly to ProFormat
const presentation = Presentation.decode(buffer);
const proFormat = PresentationToProFormat(presentation);

console.log(`Presentation name: ${proFormat.name}`);
console.log(`Arrangements:`, proFormat.arrangements);
console.log(`Groups:`, proFormat.groups);
```

### 2. Using `ProFileProcessor` to Modify and Encode

```typescript
import * as fs from "node:fs";
import ProFileProcessor, { type ProFormat, generateUUID } from "propresenter-js";

const processor = new ProFileProcessor();

// Set structured presentation data
const proData: ProFormat = {
  name: "My Song",
  note: "Verse 1, Chorus, Verse 2, Chorus",
  arrangements: [],
  groups: [],
  slides: [],
};

processor.setProFormat(proData);

// Export as ProPresenter binary (.pro) buffer
const binaryBuffer = processor.getBinaryBuffer();
if (binaryBuffer) {
  fs.writeFileSync("output.pro", binaryBuffer);
  console.log("Successfully exported output.pro");
}
```

### 3. Extracting Text from RTF

```typescript
import { RtfHelper } from "propresenter-js";

const plainText = RtfHelper.parse(rtfData);
console.log("Slide text:", plainText);
```

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm run build

# Run tests
pnpm test
```

## License

[MIT](LICENSE)
