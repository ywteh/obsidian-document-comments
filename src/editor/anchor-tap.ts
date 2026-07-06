import { EditorView } from "@codemirror/view";
import { commentConfig } from "./config";

/**
 * Mobile: tapping an anchored span (or an edit sub-span) opens the comments
 * sidebar scrolled to that thread. A floating in-context card was tried first,
 * but it fought iOS's built-in text callout (Paste / Select / Select All…) —
 * the sidebar is a surface the OS menu can't collide with.
 *
 * The handler returns false so the tap still lands normally (cursor placement,
 * selection) — opening the panel is a side effect, not a capture.
 */
export const anchorTapOpensSidebar = EditorView.domEventHandlers({
	click: (e, view) => {
		const span = (e.target as HTMLElement).closest(".doc-comment-span, .doc-comment-edit-span");
		const id = span?.getAttribute("data-cid");
		if (id) view.state.facet(commentConfig).openInSidebar?.(id);
		return false;
	},
});
