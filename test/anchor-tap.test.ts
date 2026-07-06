// @vitest-environment happy-dom
//
// Mobile: tapping an anchored span opens the comments sidebar at that thread
// (via the openInSidebar config callback). Replaced the floating popover, which
// fought iOS's built-in text callout.
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { installObsidianDom } from "./obsidian-dom";

installObsidianDom();

import { commentField } from "../src/editor/state";
import { commentConfig } from "../src/editor/config";
import { anchorTapOpensSidebar } from "../src/editor/anchor-tap";

const DOC = "A <!--c:x-->quick fox<!--/c:x--> jumps.\n" + '<!--co:x status:open quote:"quick fox"\nme: hello\n-->\n';

describe("anchor tap opens the sidebar (mobile)", () => {
	it("passes the tapped thread id to openInSidebar; plain text taps don't", () => {
		const opened: string[] = [];
		const view = new EditorView({
			state: EditorState.create({
				doc: DOC,
				extensions: [
					commentField,
					commentConfig.of({
						author: () => "me",
						showComments: () => true,
						showResolved: () => true,
						sidebarOpen: () => false,
						isMobile: () => true,
						openInSidebar: (id) => opened.push(id),
					}),
					anchorTapOpensSidebar,
				],
			}),
			parent: document.body.appendChild(document.createElement("div")),
		});

		view.contentDOM
			.querySelector('.doc-comment-span[data-cid="x"]')
			?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(opened).toEqual(["x"]);

		view.contentDOM.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(opened).toEqual(["x"]); // tap outside any anchor: no-op
		view.destroy();
	});
});
