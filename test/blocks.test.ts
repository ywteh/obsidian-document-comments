import { describe, expect, it } from "vitest";
import { snapSelectionToSafeBlocks } from "../src/format/blocks";
import { applyChanges, computeAddComment } from "../src/editor/edits";
import { anchorRange, parseComments } from "../src/format/parse";

const TABLE_DOC = ["Intro paragraph.", "", "| Col A | Col B |", "|---|---|", "| one | two |", "", "Outro."].join("\n");
const CELL = { from: TABLE_DOC.indexOf("one"), to: TABLE_DOC.indexOf("one") + 3 };
const TABLE = { from: TABLE_DOC.indexOf("| Col A"), to: TABLE_DOC.indexOf("| one | two |") + "| one | two |".length };

describe("snapSelectionToSafeBlocks", () => {
	it("leaves a plain prose selection untouched", () => {
		const s = snapSelectionToSafeBlocks(TABLE_DOC, 0, 5).unwrap();
		expect(s).toEqual({ from: 0, to: 5, openOnOwnLine: false, closeOnOwnLine: false });
	});

	it("snaps a selection inside a table cell to the whole table", () => {
		const s = snapSelectionToSafeBlocks(TABLE_DOC, CELL.from, CELL.to).unwrap();
		expect(s).toEqual({ from: TABLE.from, to: TABLE.to, openOnOwnLine: true, closeOnOwnLine: true });
	});

	it("snaps only the end that sits inside the block", () => {
		const s = snapSelectionToSafeBlocks(TABLE_DOC, 0, CELL.to).unwrap();
		expect(s.from).toBe(0);
		expect(s.openOnOwnLine).toBe(false);
		expect(s.to).toBe(TABLE.to);
		expect(s.closeOnOwnLine).toBe(true);
	});

	it("snaps out of code fences (and a | inside a fence is not a table)", () => {
		const doc = "Text.\n```py\nx = 1\ny = a | b\n```\nAfter.";
		const inFence = doc.indexOf("x = 1");
		const s = snapSelectionToSafeBlocks(doc, inFence, inFence + 5).unwrap();
		expect(doc.slice(s.from, s.to)).toBe("```py\nx = 1\ny = a | b\n```");
		expect(s.openOnOwnLine && s.closeOnOwnLine).toBe(true);
	});

	it("snaps out of multi-line and single-line $$ math", () => {
		const doc = "P.\n$$\nE = mc^2\n$$\nQ. $$a+b$$ inline-block line\n$$c$$\nR.";
		const inMath = doc.indexOf("mc^2");
		const s = snapSelectionToSafeBlocks(doc, inMath, inMath + 4).unwrap();
		expect(doc.slice(s.from, s.to)).toBe("$$\nE = mc^2\n$$");
		const oneLiner = doc.indexOf("$$c$$");
		const s2 = snapSelectionToSafeBlocks(doc, oneLiner + 3, oneLiner + 4).unwrap();
		expect(doc.slice(s2.from, s2.to)).toBe("$$c$$");
	});

	it("errs for a selection touching frontmatter", () => {
		const doc = "---\ntitle: Note\n---\nBody text.";
		const inFm = doc.indexOf("title");
		expect(snapSelectionToSafeBlocks(doc, inFm, inFm + 5).isErr()).toBe(true);
		// Body text after the frontmatter is fine.
		const inBody = doc.indexOf("Body");
		expect(snapSelectionToSafeBlocks(doc, inBody, inBody + 4).isOk()).toBe(true);
	});
});

describe("computeAddComment inside a table (the data-loss bug)", () => {
	const input = { id: "t1", createdAt: "2026-07-09T10:00:00.000Z", author: "me", text: "check this" };
	const out = applyChanges(TABLE_DOC, computeAddComment(TABLE_DOC, CELL.from, CELL.to, input).unwrap());

	it("keeps every table row on a single line (no mid-row markers)", () => {
		expect(out).toContain("| Col A | Col B |\n|---|---|\n| one | two |");
	});

	it("puts the anchor markers on their own lines around the table", () => {
		expect(out).toContain("\n<!--c:t1-->\n| Col A");
		expect(out).toContain("| one | two |\n<!--/c:t1-->\n");
	});

	it("anchors the whole table but quotes the selected text", () => {
		const c = parseComments(out)[0];
		const r = anchorRange(c)!;
		expect(out.slice(r.from, r.to)).toContain("| one | two |");
		expect(c.quote).toBe("one");
		expect(c.thread[0].text).toBe("check this");
	});
});
