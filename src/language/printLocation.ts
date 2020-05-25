import { Location } from './ast.ts';
import { Source } from './source.ts';
import { SourceLocation, getLocation } from './location.ts';

/**
 * Render a helpful description of the location in the GraphQL Source document.
 */
export function printLocation(location: Location): string {
  return printSourceLocation(
    location.source,
    getLocation(location.source, location.start),
  );
}

/**
 * Render a helpful description of the location in the GraphQL Source document.
 */
export function printSourceLocation(
  source: Source,
  sourceLocation: SourceLocation,
): string {
  const firstLineColumnOffset = source.locationOffset.column - 1;
  const body = whitespace(firstLineColumnOffset) + source.body;

  const lineIndex = sourceLocation.line - 1;
  const lineOffset = source.locationOffset.line - 1;
  const lineNum = sourceLocation.line + lineOffset;

  const columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
  const columnNum = sourceLocation.column + columnOffset;
  const locationStr = `${source.name}:${lineNum}:${columnNum}\n`;

  const lines = body.split(/\r\n|[\n\r]/g);
  const locationLine = lines[lineIndex];

  // Special case for minified documents
  if (locationLine.length > 120) {
    const subLineIndex = Math.floor(columnNum / 80);
    const subLineColumnNum = columnNum % 80;
    const subLines: string[] = [];
    for (let i = 0; i < locationLine.length; i += 80) {
      subLines.push(locationLine.slice(i, i + 80));
    }

    return (
      locationStr +
      printPrefixedLines([
        [`${lineNum}`, subLines[0]],
        ...(subLines.slice(1, subLineIndex + 1).map((subLine) => ['', subLine]) as [string, string][]),
        [' ', whitespace(subLineColumnNum - 1) + '^'],
        ['', subLines[subLineIndex + 1]],
      ])
    );
  }

  return (
    locationStr +
    printPrefixedLines([
      // Lines specified like this: ["prefix", "string"],
      [`${lineNum - 1}`, lines[lineIndex - 1]],
      [`${lineNum}`, locationLine],
      ['', whitespace(columnNum - 1) + '^'],
      [`${lineNum + 1}`, lines[lineIndex + 1]],
    ])
  );
}

function printPrefixedLines(lines: [string, string][]): string {
  const existingLines = lines.filter(([_, line]) => line !== undefined);

  const padLen = Math.max(...existingLines.map(([prefix]) => prefix.length));
  return existingLines
    .map(
      ([prefix, line]) =>
        leftPad(padLen, prefix) + (line ? ' | ' + line : ' |'),
    )
    .join('\n');
}

function whitespace(len: number): string {
  return Array(len + 1).join(' ');
}

function leftPad(len: number, str: string): string {
  return whitespace(len - str.length) + str;
}
