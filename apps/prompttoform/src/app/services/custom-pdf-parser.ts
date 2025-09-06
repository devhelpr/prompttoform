/* Minimal PDF parser (no external deps).
 * - Extracts AcroForm fields (name, type, value)
 * - Heuristically extracts titles/sections/descriptions from page text by font size
 * - Works in Browser (DecompressionStream) or Node (zlib)
 * - Limitations: no encryption; limited filter support (Flate only); no xref streams; basic tokenizer
 */

type PDFScalar = number | boolean | null | string;
class PDFName {
  constructor(public name: string) {}
  toString() {
    return `/${this.name}`;
  }
}
class PDFRef {
  constructor(public obj: number, public gen: number) {}
  toString() {
    return `${this.obj} ${this.gen} R`;
  }
}
type PDFArray = PDFValue[];
type PDFDict = { [key: string]: PDFValue };
type PDFValue = PDFScalar | PDFName | PDFArray | PDFDict | PDFRef;

interface PDFStream {
  dict: PDFDict;
  data: Uint8Array; // Decompressed if FlateDecode supported; raw otherwise
}

interface ParsedPDF {
  rawText: string;
  titles: string[];
  sections: { title: string; content: string }[];
  formFields: { name: string; type: string; value?: string }[];
  warnings: string[];
}

const isBrowser =
  typeof window !== 'undefined' &&
  typeof (globalThis as any).DecompressionStream !== 'undefined';

console.log(
  `[PDF Parser] Environment detection: isBrowser=${isBrowser}, DecompressionStream available=${
    typeof (globalThis as any).DecompressionStream !== 'undefined'
  }`
);

// JavaScript-based inflate fallback using pako library
async function pakoInflate(input: Uint8Array): Promise<Uint8Array | null> {
  try {
    console.log(
      `[PDF Parser] Attempting pako inflate for ${input.length} bytes`
    );

    // Check if it's a valid deflate stream (basic check)
    if (input.length < 2) return null;

    // Dynamic import of pako to avoid bundling issues
    const pako = await import('pako');
    const result = pako.inflate(input);
    console.log(
      `[PDF Parser] Pako inflate successful: ${input.length} -> ${result.length} bytes`
    );
    return result;
  } catch (e: any) {
    console.log(`[PDF Parser] Pako inflate failed: ${e?.message || e}`);
    return null;
  }
}

async function flateInflate(input: Uint8Array): Promise<Uint8Array> {
  // Try Browser DecompressionStream
  if (isBrowser) {
    try {
      console.log(
        `[PDF Parser] Attempting browser DecompressionStream for ${input.length} bytes`
      );
      const ds = new (globalThis as any).DecompressionStream('deflate');
      const s = new Blob([input]).stream().pipeThrough(ds);
      const resp = await new Response(s).arrayBuffer();
      const result = new Uint8Array(resp);
      console.log(
        `[PDF Parser] Browser DecompressionStream successful: ${input.length} -> ${result.length} bytes`
      );
      return result;
    } catch (e: any) {
      console.log(
        `[PDF Parser] Browser DecompressionStream failed: ${e?.message || e}`
      );
      // Fall through to try other methods
    }
  }

  // Try Node zlib (built-in) - this will fail in browser but we catch it
  try {
    console.log(
      `[PDF Parser] Attempting Node.js zlib for ${input.length} bytes`
    );
    // @ts-expect-error - dynamic import to avoid bundlers complaining in browser builds
    const zlib = await import('node:zlib');
    const out = zlib.inflateSync(input);
    const result = new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
    console.log(
      `[PDF Parser] Node.js zlib successful: ${input.length} -> ${result.length} bytes`
    );
    return result;
  } catch (e: any) {
    console.log(`[PDF Parser] Node.js zlib failed: ${e?.message || e}`);
  }

  // Try pako JavaScript inflate as fallback
  const pakoResult = await pakoInflate(input);
  if (pakoResult) {
    console.log(
      `[PDF Parser] Pako JavaScript inflate successful: ${input.length} -> ${pakoResult.length} bytes`
    );
    return pakoResult;
  }

  // Last resort: return as-is (will likely fail to extract text)
  console.log(
    `[PDF Parser] All decompression methods failed, returning raw data (${input.length} bytes)`
  );
  return input;
}

const latin1Decoder = new TextDecoder('latin1');
const latin1Encoder = new TextEncoder();

/** Basic tokenizer for PDF objects (numbers, names, strings, arrays, dicts, refs) */
class Tok {
  s: string;
  i = 0;
  constructor(s: string) {
    this.s = s;
  }
  eof() {
    return this.i >= this.s.length;
  }
  peek() {
    return this.s[this.i];
  }
  next() {
    return this.s[this.i++];
  }
  skipWS() {
    while (!this.eof()) {
      const c = this.peek();
      if (c === '%') {
        // comment until EOL
        while (!this.eof() && this.next() !== '\n') {}
      } else if (/\s/.test(c)) {
        this.i++;
      } else break;
    }
  }
  readName(): PDFName {
    // after having consumed '/'
    let out = '';
    while (!this.eof()) {
      const c = this.peek();
      if (' \t\r\n<>[]()/'.includes(c)) break;
      if (c === '#') {
        // hex-escaped
        this.next();
        const h = this.s.substr(this.i, 2);
        this.i += 2;
        out += String.fromCharCode(parseInt(h, 16));
      } else {
        out += this.next();
      }
    }
    return new PDFName(out);
  }
  readNumberOrRef(first: string): PDFValue {
    let t = first;
    while (!this.eof()) {
      const c = this.peek();
      if (!/[0-9+-.]/.test(c)) break;
      t += this.next();
    }
    const n1 = Number(t);
    this.skipWS();
    // possible ref: "<int> <int> R"
    const save = this.i;
    let n2: number | null = null;
    let n2Str = '';
    // read second int
    if (/[0-9]/.test(this.peek() || '')) {
      while (!this.eof()) {
        const c = this.peek();
        if (!/[0-9]/.test(c)) break;
        n2Str += this.next();
      }
      n2 = Number(n2Str);
      this.skipWS();
      if (this.s.substr(this.i, 1) === 'R') {
        this.i += 1;
        return new PDFRef(n1, n2);
      }
    }
    // not a ref; rewind if we consumed extra
    this.i = save;
    return n1;
  }
  readLiteralString(): string {
    // consumed '(' already
    let depth = 1;
    let out = '';
    while (!this.eof() && depth > 0) {
      const c = this.next();
      if (c === '\\') {
        const n = this.next();
        switch (n) {
          case 'n':
            out += '\n';
            break;
          case 'r':
            out += '\r';
            break;
          case 't':
            out += '\t';
            break;
          case 'b':
            out += '\b';
            break;
          case 'f':
            out += '\f';
            break;
          case '\\':
            out += '\\';
            break;
          case '(':
            out += '(';
            break;
          case ')':
            out += ')';
            break;
          default:
            if (/[0-7]/.test(n)) {
              // octal up to 3 digits
              let oct = n;
              for (let k = 0; k < 2; k++) {
                const p = this.peek();
                if (/[0-7]/.test(p)) oct += this.next();
                else break;
              }
              out += String.fromCharCode(parseInt(oct, 8));
            } else {
              out += n; // unknown escape
            }
        }
      } else if (c === '(') {
        depth++;
      } else if (c === ')') {
        depth--;
        if (depth === 0) break;
        else out += ')';
      } else out += c;
    }
    // handle UTF-16BE BOM
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      // convert UTF-16BE to JS string
      let u = '';
      for (let i = 2; i < bytes.length; i += 2) {
        u += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
      }
      return u;
    }
    // latin1 decode to unicode
    return new TextDecoder('latin1').decode(bytes);
  }
  readHexString(): string {
    // consumed '<', next not another '<'
    let hex = '';
    while (!this.eof()) {
      const c = this.next();
      if (c === '>') break;
      if (/\s/.test(c)) continue;
      hex += c;
    }
    if (hex.length % 2 === 1) hex += '0';
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(2 * i, 2), 16);
    }
    // possible UTF-16BE
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      let u = '';
      for (let i = 2; i < bytes.length; i += 2) {
        u += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
      }
      return u;
    }
    return latin1Decoder.decode(bytes);
  }
  readArray(): PDFArray {
    const arr: PDFArray = [];
    while (!this.eof()) {
      this.skipWS();
      const c = this.peek();
      if (c === ']') {
        this.i++;
        break;
      }
      arr.push(this.readObject());
    }
    return arr;
  }
  readDict(): PDFDict {
    const dict: PDFDict = {};
    while (!this.eof()) {
      this.skipWS();
      if (this.s.substr(this.i, 2) === '>>') {
        this.i += 2;
        break;
      }
      const c = this.next();
      if (c !== '/') throw new Error('Malformed dict: key must be name');
      const key = this.readName().name;
      this.skipWS();
      const val = this.readObject();
      dict[`/${key}`] = val;
    }
    return dict;
  }
  readKeyword(): PDFValue {
    const start = this.i - 1;
    while (!this.eof() && /[A-Za-z]/.test(this.peek())) this.i++;
    const w = this.s.substring(start, this.i);
    if (w === 'true') return true;
    if (w === 'false') return false;
    if (w === 'null') return null;
    return w; // operator or unknown token; let caller handle
  }
  readObject(): PDFValue {
    this.skipWS();
    const c = this.next();
    if (c === '/') return this.readName();
    if (c === '(') return this.readLiteralString();
    if (c === '<') {
      if (this.s[this.i] === '<') {
        // dict
        this.i++;
        return this.readDict();
      }
      return this.readHexString();
    }
    if (c === '[') return this.readArray();
    if (c === '-' || c === '+' || c === '.' || /[0-9]/.test(c)) {
      return this.readNumberOrRef(c);
    }
    // keywords/operators
    return this.readKeyword();
  }
}

type ObjEntry = {
  id: string;
  dict?: PDFDict;
  stream?: PDFStream;
  raw?: string;
};

function matchAll(regex: RegExp, str: string): RegExpMatchArray[] {
  const out: RegExpMatchArray[] = [];
  let m: RegExpExecArray | null;
  const r = new RegExp(
    regex.source,
    regex.flags.includes('g') ? regex.flags : regex.flags + 'g'
  );
  while ((m = r.exec(str)) !== null) out.push(m as any);
  return out as any;
}

function getStreamBounds(src: string, start: number, end: number) {
  const sIdx = src.indexOf('stream', start);
  if (sIdx === -1 || sIdx > end) return null;
  const after = sIdx + 6;
  let dataStart = after;
  // first EOL after "stream"
  if (src[after] === '\r' && src[after + 1] === '\n') dataStart = after + 2;
  else if (src[after] === '\n' || src[after] === '\r') dataStart = after + 1;
  const eIdx = src.indexOf('endstream', dataStart);
  if (eIdx === -1 || eIdx > end) return null;
  return { dictEnd: sIdx, dataStart, dataEnd: eIdx, endstreamIdx: eIdx };
}

function normalizeFilter(filter: PDFValue): string[] {
  if (filter == null) return [];
  if (filter instanceof PDFName) return [filter.name];
  if (Array.isArray(filter)) {
    return filter.map((f) => (f instanceof PDFName ? f.name : String(f)));
  }
  return [String(filter)];
}

function valueToString(v: PDFValue | undefined): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (v instanceof PDFName) return `/${v.name}`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

function refKey(r: PDFRef) {
  return `${r.obj} ${r.gen}`;
}

/** Parse the whole PDF buffer into an object table (by scanning for 'obj...endobj'). */
async function parseObjects(buf: Uint8Array) {
  const warnings: string[] = [];
  const src = latin1Decoder.decode(buf); // 1:1 index mapping (latin1)
  const objMatches = matchAll(/(\d+)\s+(\d+)\s+obj\b/g, src);
  const table = new Map<string, ObjEntry>();

  console.log(
    `[PDF Parser] Starting to parse PDF buffer (${buf.length} bytes)`
  );
  console.log(`[PDF Parser] Found ${objMatches.length} PDF objects to parse`);
  for (const m of objMatches) {
    const objNum = Number(m[1]);
    const genNum = Number(m[2]);
    const id = `${objNum} ${genNum}`;
    const objHeaderEnd = (m.index ?? 0) + m[0].length;
    const endobj = src.indexOf('endobj', objHeaderEnd);
    if (endobj === -1) {
      console.log(`[PDF Parser] Skipping object ${id} - no endobj found`);
      continue;
    }

    const streamBounds = getStreamBounds(src, objHeaderEnd, endobj);
    let dictText: string;
    let streamData: Uint8Array | null = null;

    if (streamBounds) {
      dictText = src.slice(objHeaderEnd, streamBounds.dictEnd).trim();
      streamData = buf.subarray(streamBounds.dataStart, streamBounds.dataEnd);
      console.log(
        `[PDF Parser] Object ${id} has stream data (${streamData.length} bytes)`
      );
    } else {
      dictText = src.slice(objHeaderEnd, endobj).trim();
      console.log(`[PDF Parser] Object ${id} has no stream data`);
    }

    let dict: PDFDict | undefined;
    try {
      const t = new Tok(dictText);
      t.skipWS();
      // objects are usually <<dict>> [possibly other tokens], or direct scalar/array/dict
      const v = t.readObject();
      if (
        typeof v === 'object' &&
        v !== null &&
        !(v instanceof PDFName) &&
        !(v instanceof PDFRef) &&
        !Array.isArray(v)
      ) {
        dict = v as PDFDict;
        console.log(
          `[PDF Parser] Object ${id} parsed as dictionary with ${
            Object.keys(dict).length
          } keys`
        );
      } else {
        // Non-dict objects (numbers, arrays, etc.)
        console.log(
          `[PDF Parser] Object ${id} is not a dictionary (type: ${typeof v})`
        );
        table.set(id, { id, raw: dictText });
        continue;
      }
    } catch (e: any) {
      const errorMsg = `Failed to parse dict for obj ${id}: ${e?.message || e}`;
      console.log(`[PDF Parser] ${errorMsg}`);
      warnings.push(errorMsg);
      table.set(id, { id, raw: dictText });
      continue;
    }

    let stream: PDFStream | undefined;
    if (streamData) {
      // Decompress if Flate
      const filters = normalizeFilter(dict['/Filter']);
      let data = streamData;
      console.log(
        `[PDF Parser] Object ${id} stream filters: ${
          filters.join(', ') || 'none'
        }`
      );

      if (filters.includes('FlateDecode')) {
        try {
          data = await flateInflate(streamData);
          if (data.length !== streamData.length) {
            console.log(
              `[PDF Parser] Object ${id} FlateDecode successful: ${streamData.length} -> ${data.length} bytes`
            );
          } else {
            console.log(
              `[PDF Parser] Object ${id} FlateDecode returned raw data (decompression may have failed)`
            );
            // Don't add to warnings if we got some data back, even if it's raw
          }
        } catch (e: any) {
          const errorMsg = `Failed to Flate-decode stream ${id}: ${
            e?.message || e
          }`;
          console.log(`[PDF Parser] ${errorMsg}`);
          warnings.push(errorMsg);
        }
      } else if (filters.length > 0) {
        const warningMsg = `Unsupported stream filter on ${id}: ${filters.join(
          ', '
        )}`;
        console.log(`[PDF Parser] ${warningMsg}`);
        warnings.push(warningMsg);
      }
      stream = { dict, data };
    }

    table.set(id, { id, dict, stream, raw: dictText });
  }

  console.log(`[PDF Parser] Completed parsing ${table.size} objects`);
  if (warnings.length > 0) {
    console.log(`[PDF Parser] Warnings encountered: ${warnings.length}`);
    warnings.forEach((warning) =>
      console.log(`[PDF Parser] Warning: ${warning}`)
    );
  }

  return { table, warnings };
}

function asName(v: PDFValue | undefined): string | undefined {
  if (!v) return;
  if (v instanceof PDFName) return `/${v.name}`;
  if (typeof v === 'string' && v.startsWith('/')) return v;
  return;
}
function asArray(v: PDFValue | undefined): PDFArray | undefined {
  if (Array.isArray(v)) return v;
  return;
}
function asRef(v: PDFValue | undefined): PDFRef | undefined {
  if (v instanceof PDFRef) return v;
  return;
}

function resolve(
  table: Map<string, ObjEntry>,
  v: PDFValue | undefined
): PDFDict | PDFStream | PDFValue | undefined {
  if (!v) return;
  if (v instanceof PDFRef) {
    const e = table.get(refKey(v));
    if (!e) return;
    if (e.stream) return e.stream;
    if (e.dict) return e.dict;
    return e.raw;
  }
  return v;
}

function findCatalog(
  table: Map<string, ObjEntry>
): { id: string; dict: PDFDict } | null {
  console.log(`[PDF Parser] Searching for catalog in ${table.size} objects`);
  for (const [id, e] of table) {
    const d = e.dict;
    if (!d) continue;
    const typ = asName(d['/Type']);
    if (typ === '/Catalog') {
      console.log(`[PDF Parser] Found catalog at object ${id}`);
      return { id, dict: d };
    }
  }
  console.log(`[PDF Parser] No catalog found`);
  return null;
}

function collectAcroFormFields(
  table: Map<string, ObjEntry>,
  acro: PDFDict
): { name: string; type: string; value?: string }[] {
  const out: { name: string; type: string; value?: string }[] = [];
  const seen = new Set<string>();

  const fields = asArray(resolve(table, acro['/Fields']) as any) || [];
  console.log(`[PDF Parser] Found ${fields.length} AcroForm fields to process`);

  function descend(fieldObj: PDFDict) {
    const name = valueToString(fieldObj['/T']) || '';
    const ft = asName(fieldObj['/FT']) || '';
    let type = '';
    switch (ft) {
      case '/Btn':
        type = 'Button/Checkbox/Radio';
        break;
      case '/Tx':
        type = 'Text';
        break;
      case '/Ch':
        type = 'Choice';
        break;
      case '/Sig':
        type = 'Signature';
        break;
      default:
        type = ft || 'Unknown';
    }
    let value = valueToString(resolve(table, fieldObj['/V']) as any);
    if (!value && fieldObj['/AS']) value = valueToString(fieldObj['/AS']); // appearance state for checkboxes/radios

    if (name) {
      console.log(
        `[PDF Parser] Found form field: "${name}" [${type}]${
          value ? ` = "${value}"` : ''
        }`
      );
      out.push({ name, type, value: value ?? undefined });
    }

    const kids = asArray(resolve(table, fieldObj['/Kids']) as any);
    if (kids) {
      for (const kid of kids) {
        const kref = asRef(kid as any);
        let kd: PDFDict | undefined;
        if (kref) {
          const entry = table.get(refKey(kref));
          if (entry?.dict && !seen.has(refKey(kref))) {
            seen.add(refKey(kref));
            kd = entry.dict;
          }
        } else if (
          typeof kid === 'object' &&
          kid &&
          !Array.isArray(kid) &&
          !(kid instanceof PDFName)
        ) {
          kd = kid as PDFDict;
        }
        if (kd) descend(kd);
      }
    }
  }

  for (const f of fields) {
    const r = asRef(f as any);
    let d: PDFDict | undefined;
    if (r) {
      const e = table.get(refKey(r));
      if (e?.dict) d = e.dict;
    } else if (
      typeof f === 'object' &&
      f &&
      !Array.isArray(f) &&
      !(f instanceof PDFName)
    ) {
      d = f as PDFDict;
    }
    if (d) descend(d);
  }

  console.log(`[PDF Parser] Extracted ${out.length} form fields total`);
  return out;
}

/** Extract text items (with font size) from page content streams */
function parseContentStreamText(
  bytes: Uint8Array
): { text: string; size: number }[] {
  const s = latin1Decoder.decode(bytes);
  const t = new Tok(s);
  let inText = false;
  let curSize = 12;
  const items: { text: string; size: number }[] = [];
  let currentLine = '';

  console.log(
    `[PDF Parser] Parsing content stream (${bytes.length} bytes, ${s.length} chars)`
  );

  function flush() {
    if (currentLine) {
      items.push({ text: currentLine, size: curSize });
      currentLine = '';
    }
  }

  while (!t.eof()) {
    t.skipWS();
    if (t.eof()) break;
    const saved = t.i;
    let token = t.readObject();
    if (typeof token === 'string') {
      // Operators & barewords
      const op = token;
      if (op === 'BT') {
        inText = true;
        continue;
      }
      if (op === 'ET') {
        inText = false;
        flush();
        continue;
      }
      if (!inText) continue;

      if (op === 'Tf') {
        // font selection: stack is [fontName size] Tf
        // backtrack to read operands
        // simplistic: find two previous values by rewinding a bit (not robust but works for many streams)
        // Instead, look ahead: we already read operator, so rewind and manually parse two objects then 'Tf'
        t.i = saved; // rewind to before operator
        // read font name and size then operator
        const fName = t.readObject();
        const fSize = t.readObject();
        t.readObject(); // consume 'Tf'
        if (typeof fSize === 'number') curSize = fSize;
        continue;
      }
      if (op === 'Tj') {
        // one string
        t.i = saved;
        const str = t.readObject(); // operand
        t.readObject(); // operator
        if (typeof str === 'string') currentLine += str;
        continue;
      }
      if (op === 'TJ') {
        // array of strings and kerning numbers
        t.i = saved;
        const arr = t.readObject();
        t.readObject(); // operator
        if (Array.isArray(arr)) {
          for (const el of arr) {
            if (typeof el === 'string') currentLine += el;
          }
        }
        continue;
      }
      if (op === "'") {
        // move to next line & show text
        t.i = saved;
        const str = t.readObject();
        t.readObject(); // operator
        flush();
        if (typeof str === 'string') currentLine += str;
        continue;
      }
      if (op === '"') {
        // set word/char spacing and show
        t.i = saved;
        const aw = t.readObject();
        const ac = t.readObject();
        const str = t.readObject();
        t.readObject(); // operator
        flush();
        if (typeof str === 'string') currentLine += str;
        continue;
      }
      if (op === 'T*') {
        // next line
        flush();
        continue;
      }
      if (op === 'Td' || op === 'TD') {
        // move text position
        // treat like a line break for heuristic grouping
        flush();
        continue;
      }
      // otherwise ignore
    }
  }
  flush();
  // Trim items
  const filteredItems = items
    .map((it) => ({ text: it.text.replace(/\s+/g, ' ').trim(), size: it.size }))
    .filter((it) => it.text.length > 0);

  console.log(
    `[PDF Parser] Extracted ${filteredItems.length} text items from content stream`
  );
  return filteredItems;
}

function buildHeadingsAndSections(
  textItems: { text: string; size: number }[]
): { titles: string[]; sections: { title: string; content: string }[] } {
  if (textItems.length === 0) {
    console.log(`[PDF Parser] No text items to build sections from`);
    return { titles: [], sections: [] };
  }

  const sizes = Array.from(new Set(textItems.map((t) => t.size))).sort(
    (a, b) => b - a
  );
  const h1Size = sizes[0] ?? 12;
  const h2Size = sizes[1] ?? h1Size * 0.8;

  console.log(
    `[PDF Parser] Building sections from ${textItems.length} text items`
  );
  console.log(
    `[PDF Parser] Font sizes found: ${sizes.join(
      ', '
    )} (H1: ${h1Size}, H2: ${h2Size})`
  );

  const sections: { title: string; content: string }[] = [];
  let current: { title: string; content: string } | null = null;

  for (const it of textItems) {
    if (it.size >= h1Size - 0.1) {
      if (current) sections.push(current);
      current = { title: it.text, content: '' };
    } else if (it.size >= h2Size - 0.1) {
      if (current) sections.push(current);
      current = { title: it.text, content: '' };
    } else {
      if (!current) current = { title: 'Document', content: '' };
      current.content += (current.content ? '\n' : '') + it.text;
    }
  }
  if (current) sections.push(current);

  const titles = sections.length ? [sections[0].title] : [];
  console.log(
    `[PDF Parser] Built ${sections.length} sections with ${titles.length} titles`
  );
  return { titles, sections };
}

/** Main API */
export async function parsePDF(arrayBuffer: ArrayBuffer): Promise<ParsedPDF> {
  console.log(`[PDF Parser] ===== Starting PDF parsing =====`);
  console.log(
    `[PDF Parser] Input buffer size: ${arrayBuffer.byteLength} bytes`
  );

  const buf = new Uint8Array(arrayBuffer);
  const { table, warnings } = await parseObjects(buf);

  // Find catalog & AcroForm
  console.log(`[PDF Parser] ===== Looking for AcroForm =====`);
  const cat = findCatalog(table);
  let formFields: ParsedPDF['formFields'] = [];
  if (cat) {
    const afVal = resolve(table, cat.dict['/AcroForm']);
    let afDict: PDFDict | undefined;
    if (
      afVal &&
      !(afVal as any)['data'] &&
      typeof afVal === 'object' &&
      !Array.isArray(afVal) &&
      !(afVal instanceof PDFName)
    ) {
      afDict = afVal as PDFDict;
      console.log(`[PDF Parser] Found AcroForm dictionary`);
    } else {
      console.log(`[PDF Parser] No AcroForm found in catalog`);
    }
    if (afDict) {
      formFields = collectAcroFormFields(table, afDict);
    }
  } else {
    console.log(`[PDF Parser] No catalog found, skipping AcroForm extraction`);
  }

  // Collect page content streams and extract text
  console.log(`[PDF Parser] ===== Extracting page content =====`);
  const textItemsAll: { text: string; size: number }[] = [];
  let pageCount = 0;
  for (const [, e] of table) {
    const d = e.dict;
    if (!d) continue;
    const typ = asName(d['/Type']);
    if (typ !== '/Page') continue;

    pageCount++;
    console.log(`[PDF Parser] Processing page ${pageCount}`);

    const contents = resolve(table, d['/Contents']);
    const streams: PDFStream[] = [];
    if (contents && (contents as any).data) {
      streams.push(contents as PDFStream);
    } else if (Array.isArray(contents)) {
      for (const c of contents) {
        const r = asRef(c as any);
        if (!r) continue;
        const ce = table.get(refKey(r));
        if (ce?.stream) streams.push(ce.stream);
      }
    }
    for (const s of streams) {
      const items = parseContentStreamText(s.data);
      textItemsAll.push(...items);
    }
  }

  console.log(
    `[PDF Parser] Processed ${pageCount} pages, extracted ${textItemsAll.length} total text items`
  );

  // Build headings/sections heuristically
  console.log(`[PDF Parser] ===== Building document structure =====`);
  const { titles, sections } = buildHeadingsAndSections(textItemsAll);
  const rawText = textItemsAll.map((t) => t.text).join('\n');

  const result = {
    rawText,
    titles,
    sections,
    formFields,
    warnings,
  };

  console.log(`[PDF Parser] ===== Parsing complete =====`);
  console.log(`[PDF Parser] Results:`);
  console.log(`[PDF Parser] - Raw text length: ${rawText.length} characters`);
  console.log(`[PDF Parser] - Titles: ${titles.length}`);
  console.log(`[PDF Parser] - Sections: ${sections.length}`);
  console.log(`[PDF Parser] - Form fields: ${formFields.length}`);
  console.log(`[PDF Parser] - Warnings: ${warnings.length}`);

  return result;
}

/** Helper: format a prompt-ready summary */
export function toPromptSummary(parsed: ParsedPDF): string {
  console.log(`[PDF Parser] ===== Generating prompt summary =====`);

  const lines: string[] = [];
  if (parsed.titles.length) {
    lines.push(`Title: ${parsed.titles.join(' | ')}`);
    console.log(`[PDF Parser] Added title: ${parsed.titles.join(' | ')}`);
  }

  if (parsed.sections.length) {
    lines.push('Sections:');
    console.log(
      `[PDF Parser] Adding ${parsed.sections.length} sections to summary`
    );
    for (const s of parsed.sections.slice(0, 10)) {
      const content =
        s.content.slice(0, 200) + (s.content.length > 200 ? '…' : '');
      lines.push(`- ${s.title}: ${content}`);
    }
  }

  if (parsed.formFields.length) {
    lines.push('Form fields:');
    console.log(
      `[PDF Parser] Adding ${parsed.formFields.length} form fields to summary`
    );
    for (const f of parsed.formFields) {
      lines.push(`- ${f.name} [${f.type}]${f.value ? ` = ${f.value}` : ''}`);
    }
  }

  const summary = lines.join('\n');
  console.log(`[PDF Parser] Generated summary: ${summary.length} characters`);
  return summary;
}
