import { Result } from "better-result";

/** Where the anchor markers may be written for a selection, after snapping out of
 *  structures that inline HTML comments would corrupt. Each end snaps
 *  independently: an end inside a table/fence/math block moves to the block's
 *  boundary and its marker goes on its own line; an end in plain prose stays put
 *  with an inline marker. */
export type SnappedRange = {
	from: number;
	to: number;
	openOnOwnLine: boolean;
	closeOnOwnLine: boolean;
};

type Kind = "table" | "fence" | "math" | "frontmatter";
type Block = { kind: Kind; from: number; to: number };
type Line = { from: number; to: number; text: string };

const lineList = (doc: string): Line[] => {
	const lines: Line[] = [];
	let offset = 0;
	for (const text of doc.split("\n")) {
		lines.push({ from: offset, to: offset + text.length, text });
		offset += text.length + 1;
	}
	return lines;
};

/** Line-aligned ranges (delimiter lines included) whose internals can't take
 *  inline HTML-comment markers: a table row must stay one line, and fenced code /
 *  $$ math / frontmatter treat the markers as literal content. One pass with a
 *  mode so a `|` inside a code fence doesn't read as a table. */
const unsafeBlocks = (doc: string): Block[] => {
	const blocks: Block[] = [];
	const lines = lineList(doc);

	let fence: { char: string; from: number } | null = null;
	let math: { from: number } | null = null;
	let table: { from: number; to: number } | null = null;
	let frontmatter = lines.length > 0 && lines[0].text.trim() === "---" ? { open: true } : null;
	const flushTable = () => {
		if (table) blocks.push({ kind: "table", from: table.from, to: table.to });
		table = null;
	};

	for (const [i, line] of lines.entries()) {
		const t = line.text.trim();

		if (frontmatter?.open && i > 0) {
			if (t === "---" || t === "...") {
				blocks.push({ kind: "frontmatter", from: 0, to: line.to });
				frontmatter = null;
			}
			continue; // everything up to the closing --- is frontmatter
		}
		if (i === 0 && frontmatter) continue;

		const fenceMark = /^(`{3,}|~{3,})/.exec(t);
		if (fence) {
			if (fenceMark && fenceMark[1][0] === fence.char) {
				blocks.push({ kind: "fence", from: fence.from, to: line.to });
				fence = null;
			}
			continue;
		}
		if (math) {
			if (t.endsWith("$$")) {
				blocks.push({ kind: "math", from: math.from, to: line.to });
				math = null;
			}
			continue;
		}
		if (fenceMark) {
			flushTable();
			fence = { char: fenceMark[1][0], from: line.from };
			continue;
		}
		if (t.startsWith("$$")) {
			flushTable();
			// One-liner ($$…$$) is its own block; otherwise the block runs to the
			// closing $$ line.
			if (t.length >= 4 && t.endsWith("$$")) blocks.push({ kind: "math", from: line.from, to: line.to });
			else math = { from: line.from };
			continue;
		}
		if (t.startsWith("|")) {
			table = table ? { from: table.from, to: line.to } : { from: line.from, to: line.to };
			continue;
		}
		flushTable();
	}
	flushTable();
	if (fence) blocks.push({ kind: "fence", from: fence.from, to: doc.length });
	if (math) blocks.push({ kind: "math", from: math.from, to: doc.length });
	return blocks;
};

/**
 * Snap a selection's ends out of marker-hostile structures (§ project plan:
 * "anchor markers corrupt block structures"). Writing `<!--c:ID-->` inline into
 * a table cell breaks the row (a data-loss bug in practice); instead the anchor
 * widens to wrap the whole block, markers on their own lines. An end in plain
 * prose is untouched. Frontmatter can't be wrapped at all (markers above it
 * would unmake it) — errs, pointing at whole-file comments.
 */
export const snapSelectionToSafeBlocks = (doc: string, from: number, to: number): Result<SnappedRange, string> => {
	const snapped: SnappedRange = { from, to, openOnOwnLine: false, closeOnOwnLine: false };
	for (const b of unsafeBlocks(doc)) {
		// Inclusive bounds: blocks are line-aligned, so a position within
		// [b.from, b.to] means the insertion would land ON a block line (b.from
		// prepends the first line, b.to appends to the last — both corrupt it).
		// b.from-1 / b.to+1 are the neighboring lines' boundaries and are safe.
		const fromOn = from >= b.from && from <= b.to;
		const toOn = to >= b.from && to <= b.to;
		if (!fromOn && !toOn) continue;
		if (b.kind === "frontmatter") {
			return Result.err("Can't comment inside frontmatter — add a whole-file comment instead.");
		}
		if (fromOn) {
			snapped.from = b.from;
			snapped.openOnOwnLine = true;
		}
		if (toOn) {
			snapped.to = b.to;
			snapped.closeOnOwnLine = true;
		}
	}
	return Result.ok(snapped);
};
