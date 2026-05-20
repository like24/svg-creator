---
name: wechat-svg-authoring
description: Use when generating, modifying, reviewing, or learning from WeChat public account SVG animations, including SMIL click/touch interactions, sequence frames, horizontal scroll, long image slicing, local image workflows, CDN replacement, and incremental case-library learning.
---

# WeChat SVG Authoring

Use this skill for WeChat public account SVG animation work.

## Hard Rules

- Do not use JavaScript.
- Do not use external CSS.
- Use inline HTML/SVG/SMIL.
- Development images use local relative paths such as `./images/bg.png`.
- Do not hand-write CDN links for development output; publishing uses `packages/wechat-svg-cdn`.
- `viewBox` must come from the actual UI/image dimensions provided by the user.
- Use `width:100%` for responsive scaling.
- Use transparent hot zones for click/touch interaction.
- Prefer `click`, `touchstart`, `touchmove`, and `click+Ns`.
- Do not default to `mouseover`, `mouseout`, or `dblclick` for mobile WeChat.

## Reference Files

Read only what is needed:

- `references/svg-authoring-spec.md`: generation rules, animation modes, parameterized templates.
- `references/svg-case-index.md`: case-to-pattern lookup.
- `references/svg-case-evidence.md`: full case evidence table.
- `references/svg-layout-patterns.md`: layout-specific notes.

## Generation Workflow

1. Get or infer the UI/image dimensions from the user-provided details or local files.
2. Select a pattern from `svg-authoring-spec.md`.
3. If the user references a known effect or source file, consult `svg-case-index.md` and then the source HTML if needed.
4. Generate development-stage HTML/SVG with local image paths.
5. Keep dimensions concrete in final output; do not leave `{W}` or `{IMG_*}` placeholders unless the user asks for a template.
6. Keep interactions inside SVG/SMIL.
7. Before finishing, check that there is no JS, external CSS, fixed default canvas assumption, or hand-written CDN dependency.

## Incremental Learning Workflow

Use this when the user adds new `source/*.html` cases or asks to update the rules.

1. Detect new or changed cases by comparing `source/*.html` with entries in `source/notes/svg-case-evidence.md`.
2. For each new/changed case, extract evidence:
   - frequent tags
   - `viewBox` dimensions
   - image references
   - `begin` triggers
   - `attributeName`
   - `repeatCount`
   - `calcMode`
   - scroll, touch, parallax, hot-zone, link patterns
3. Update `source/notes/svg-case-evidence.md` first. This is the fact table.
4. Update `source/notes/svg-case-index.md` with layout, interaction, key techniques, reuse scenarios, and risks.
5. Update `source/notes/svg-authoring-spec.md` only if the case introduces a new reusable rule or changes an existing rule.
6. Sync updated notes into this skill's `references/` folder and the matching Claude/Codex skill folder when present.
7. Report changed files and newly learned patterns.

## Publishing Workflow

Development output uses local paths. For publishing, use the project tool:

```bash
cd packages
npm start -- ../path/to/article.html
```

Or, if available:

```bash
wechat-svg-cdn ./article.html
wechat-svg-cdn draft ./article.html -t "文章标题"
```

The tool scans local paths in CSS `background-image`, SVG `<image href>`, and HTML `<img src>`.
