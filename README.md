# Document Comments

Notion / Linear-style **margin comments** for Obsidian — except the comments live **inside the markdown file**, stored as HTML comments. They render as floating cards in the right margin, but any other tool that reads the raw `.md` sees them in context (a comment-free editor, a `git diff`, or a script all read the same thing).

This is a fork of [kylemcd/obsidian-document-comments](https://github.com/kylemcd/obsidian-document-comments) that extends it with **suggested edits** (propose → accept/reject, tracked-changes style), **line- and file-level comment scopes**, and a reworked highlighting/navigation model. Everything below describes this fork.

![Document Comments — threaded comment cards in the right margin of an Obsidian note](screenshot.png)

## Features

- **Inline storage.** Comments are plain HTML comments in the file — invisible in Reading view and in other markdown renderers, and legible to tools that read the raw text.
- **Suggested edits.** A thread can carry concrete edit proposals anchored to the exact text they would change. Each renders as an old → new diff row with **Accept / Reject** buttons: accepting replaces the text (and cleans up spacing around deletions), rejecting leaves the prose untouched; either way the decision is logged to the thread. Proposals whose text has **changed since they were made** get a staleness warning; proposals whose range **overlaps another comment's anchor** are flagged and can't be accepted (rejecting is always safe).
- **Three comment scopes.** Comment on a **selection**, on the **current line**, or on the **whole file** (right-click the note's inline title). File-level comments have no text anchor — they mark and flare the note title instead, and list first in the sidebar.
- **Pinned references.** A thread can carry `refs:"[[Note A]],[[Note B]]"` — cross-note links that render in the card and navigate on click (as do links typed in any comment).
- **Margin cards** in Live Preview, Source, and Reading view, aligned to the highlighted text. Click a card to flash its anchor; hover to light it up.
- **Two-way highlight sync.** Hover a suggestion row to see exactly which text it would change; move the **text cursor** into an anchored span and the matching card lights up (in the sidebar, it also scrolls into view) — with the cursor inside an edit target, the specific suggestion row lights too. Focusing the title does the same for file-level comments.
- **Marker-safe editing.** Backspace/Delete at the edge of an anchor deletes the adjacent *visible* character, not the invisible marker — a single keypress can't silently break a comment's anchor or delete a thread block. Deliberately deleting a whole anchored span is allowed; the comment survives as an **orphan** with an "anchor lost" banner showing the text it used to sit on.
- **Threads, resolve / reopen, emoji reactions, edit & delete** — every action is a plain edit to the markdown, so it round-trips cleanly.
- **Markdown in comment text** — code spans, bold, links, lists, etc. render in the cards (margin and sidebar).
- **Long comments collapse** to a *Show more* preview; a thread taller than the screen opens in the sidebar instead.
- **Inline composer.** Select text → command or right-click → a draft card opens in the margin (no modal). On mobile, a small dialog takes its place.
- **"All discussions" sidebar** — a panel listing the active note's comments with **Open / Resolved / All** filter tabs. The sidebar and the inline cards are alternatives: opening one turns the other off (the in-text highlights stay while either is visible), and closing the sidebar collapses its dock.
- **Toggle comments** on/off (also hides the text highlights), and **hide resolved** comments by default.
- **Mobile.** On phones and tablets the floating margin is turned off (there's no room for it): the in-text **highlights** still mark commented text, and **tapping a highlighted anchor opens the sidebar at that thread** — reading, replying, resolving, and accept/reject all happen there. New comments are composed in a quick dialog. It's the same inline storage, so a note's comments are identical on desktop and mobile.

## How comments are stored

```markdown
We should <!--c:k3f9-->ship on <!--e:e1-->Friday<!--/e:e1--><!--/c:k3f9--> regardless of the QA timeline.
<!--co:k3f9 by:kyle at:2026-06-17T10:00:00.000Z status:open quote:"ship on Friday" refs:"[[QA Plan]]"
kyle (2026-06-17T10:00:00.000Z): I thought we agreed Thursday?
sam (2026-06-17T10:05:00.000Z): Thursday is better for QA — proposing the fix.
~ @e1 was:"Friday" state:proposed -> "Thursday"
+👍 kyle
-->
```

- `<!--c:ID-->…<!--/c:ID-->` delimits the highlighted span; `<!--co:ID …-->` holds the thread. A file-level comment is a `co:` block with no anchor span and no `quote:`.
- `<!--e:EID-->…<!--/e:EID-->` delimits the exact text a **suggested edit** would replace, and its `~ @EID was:"old" state:proposed -> "new"` line holds the proposal (`-> ""` is a deletion). Accepting rewrites the text and removes both; the `was:` snapshot is what staleness is checked against.
- `+emoji names` lines are reactions; `refs:"…"` pins related notes.

The markers are HTML comments, so they don't render anywhere except this plugin. Any external tool can list threads by scanning for `<!--co:`, find the referenced text via the matching span or the redundant `quote:` value, and *propose* edits by writing the same `e:`/`~` format — the plugin's Accept/Reject UI is then the human gate.

## Install

This fork is not in the Community plugins store (the upstream plugin is). Install it with BRAT, manually, or from source. Requires **Obsidian 1.7.2 or newer**.

### BRAT

1. Install **BRAT** (Settings → Community plugins → Browse → search "BRAT") and enable it.
2. Run the command **BRAT: Add a beta plugin for testing** and enter:
   `ywteh/obsidian-document-comments`
3. Enable **Document Comments** in Settings → Community plugins.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/ywteh/obsidian-document-comments/releases).
2. Drop them in `<your-vault>/.obsidian/plugins/document-comments/` (create the folder).
3. In Obsidian, reload (or restart), then enable **Document Comments** under Settings → Community plugins.

### Build from source

```bash
git clone https://github.com/ywteh/obsidian-document-comments
cd obsidian-document-comments
npm install
npm run build
```

Then copy (or symlink) `main.js`, `manifest.json`, and `styles.css` into
`<your-vault>/.obsidian/plugins/document-comments/` and enable the plugin.

## Usage

- **Comment on a selection:** select text, then right-click → **Comment on selection** (or the command palette). Type in the margin card and press Enter (Shift+Enter for a newline).
- **Comment on a line:** right-click anywhere in the line → **Comment on line**.
- **Comment on the whole file:** right-click the note's **inline title** → **Comment on whole file**.
- **Review suggested edits:** open the thread's card — each proposal is a diff row. **✓ accepts** (applies the change), **✕ rejects** (discards the proposal, prose untouched). Hover a row to see the exact text it targets; heed the ⚠ warnings for stale or overlapping proposals.
- **Reply / resolve / react / edit / delete:** hover a card to reveal its action bar, or use the ⋯ menu.
- **Sidebar:** the *Toggle comments sidebar* ribbon icon or command. *Toggle document comments* switches between inline cards and none (and, if the sidebar is open, switches you back to inline cards).

Set the name attached to your comments under **Settings → Document Comments → Author**.

## Privacy

No network use, no telemetry, no accounts. Everything stays in your vault.

## Known limitations & loose ends

- **Suggested-edit text is single-line prose.** The `was:`/replacement values are quoted on one line, so they can't contain a literal `"`, a newline, or runs of spaces — surgical prose edits work; code blocks and multi-line rewrites aren't supported by the format yet.
- **Overlapping anchors are flagged, not fixed.** Nested anchors are fine; a suggestion whose range *partially* overlaps another anchor is blocked from Accept (it would corrupt the other marker). There's no auto-repair — reject it and re-propose with a cleaner range.
- **Edit-target sub-highlights are editor-only.** Reading view shows the main comment highlight but not the per-suggestion sub-spans (accept/reject still works from the cards); cursor-driven card activation is likewise Live Preview / Source only, since Reading view has no text cursor.
- **File-level vs orphan is inferred from `quote:`.** A body block with no anchor and no `quote:` is a whole-file comment; with a `quote:` it's treated as a comment that lost its anchor. Hand-written blocks should follow that convention.
- In **Live Preview**, the highlight doesn't show on text inside a **table** (Obsidian renders tables as a self-contained widget the highlight can't reach). The comment and its card still work, and the highlight shows in **Reading view** and **Source mode**.
- On **mobile**, comments are managed through the sidebar (see Features); the suggested-edit accept/reject flow works there too but has had less field testing than desktop.

## Development

```bash
npm install
npm run dev      # esbuild watch → main.js
npm run build    # typecheck + production bundle
npm run check    # oxfmt + oxlint + eslint + tsc + vitest
npm test         # vitest
```

The test suite includes headless integration tests that run the real editor plugins in a live CodeMirror view; `test/obsidian-mock.ts` + `test/obsidian-dom.ts` stand in for Obsidian's runtime (the npm package is types-only).

**Releasing.** Pushing a version tag (e.g. `git tag 0.1.1 && git push origin 0.1.1`) runs [`.github/workflows/release.yml`](.github/workflows/release.yml): it builds the plugin, generates GitHub [artifact attestations](https://docs.github.com/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds) for the release assets, and publishes the release (and fails fast if the tag doesn't match `manifest.json`'s version). Verify a downloaded asset with `gh attestation verify main.js --repo ywteh/obsidian-document-comments`.

## License

MIT — see [LICENSE](LICENSE). Forked from [kylemcd/obsidian-document-comments](https://github.com/kylemcd/obsidian-document-comments).
