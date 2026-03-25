/**
 * Simple multipart/form-data parser for Azure Functions.
 */

export interface ParsedField {
  name: string;
  value: string;
}

export interface ParsedFile {
  name: string;
  filename: string;
  contentType: string;
  data: Buffer;
}

export interface ParsedForm {
  fields: ParsedField[];
  files: ParsedFile[];
}

export function parseMultipart(body: Buffer, contentType: string): ParsedForm {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
  if (!boundaryMatch) throw new Error("No boundary found in content-type");
  const boundary = boundaryMatch[1] || boundaryMatch[2];

  const result: ParsedForm = { fields: [], files: [] };
  const boundaryBuffer = Buffer.from(`--${boundary}`);

  // Split by boundary
  const parts: Buffer[] = [];
  let start = indexOf(body, boundaryBuffer, 0);
  if (start === -1) return result;

  start += boundaryBuffer.length;
  // Skip CRLF after first boundary
  if (body[start] === 0x0d && body[start + 1] === 0x0a) start += 2;

  while (true) {
    const end = indexOf(body, boundaryBuffer, start);
    if (end === -1) break;
    parts.push(body.subarray(start, end - 2)); // -2 to remove trailing CRLF before boundary
    start = end + boundaryBuffer.length;
    // Check for closing --
    if (body[start] === 0x2d && body[start + 1] === 0x2d) break;
    // Skip CRLF
    if (body[start] === 0x0d && body[start + 1] === 0x0a) start += 2;
  }

  for (const part of parts) {
    // Find header/body separator (double CRLF)
    const headerEnd = indexOf(part, Buffer.from("\r\n\r\n"), 0);
    if (headerEnd === -1) continue;

    const headerStr = part.subarray(0, headerEnd).toString("utf-8");
    const bodyData = part.subarray(headerEnd + 4);

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);
      const ct = ctMatch ? ctMatch[1].trim() : "application/octet-stream";
      result.files.push({
        name,
        filename,
        contentType: ct,
        data: Buffer.from(bodyData),
      });
    } else {
      result.fields.push({ name, value: bodyData.toString("utf-8") });
    }
  }

  return result;
}

function indexOf(buf: Buffer, search: Buffer, from: number): number {
  for (let i = from; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}
