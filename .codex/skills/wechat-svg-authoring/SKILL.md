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
- In article output, HTML-level tags may only be `section`; all visual and interaction elements must live inside `svg`.
- Animate only whitelisted SVG attributes: `x`, `y`, `width`, `height`, `opacity`, `d`, `points`, `stroke-width`, `stroke-linecap`, `stroke-dashoffset`, `fill`, `visibility`, `transform`, and `animateMotion path`.
- Development images use local relative paths such as `./images/bg.png`.
- If the user does not provide image assets, keep the image-layer structure and use same-size color-block placeholders in development output.
- Do not hand-write CDN links for development output; publishing uses `packages/wechat-svg-cdn`.
- `viewBox` must come from the actual UI/image dimensions provided by the user.
- Use `width:100%` for responsive scaling.
- Use transparent hot zones for click/touch interaction.
- Prefer `click`, `touchstart`, `touchmove`, and `click+Ns`.
- Prefer source-style parent-child bubbling with `begin="click"`; do not use `id + begin="xxx.click"` for core interaction unless explicitly justified.
- Provide clear trigger affordance, visible feedback, and anti-mistouch handling for every interaction.
- Do not default to `mouseover`, `mouseout`, or `dblclick` for mobile WeChat.

## Forbidden Syntax

- Do not write `begin="someId.click"` or `begin="someId.touchstart"` as core interaction logic.
- Do not write `onclick=`, `ontouchstart=`, `onload=`, or any inline DOM event handler.
- Do not write `<script>`, external `<link rel="stylesheet">`, `@import`, or external CSS files.
- Do not write HTML tags other than `section` around or between SVG blocks, including `div`, `span`, `p`, `a`, `img`, `details`, `summary`, `style`, `button`, `canvas`, or `input`.
- Do not rely on CSS selectors, `class=`, or `id=` for animation state or trigger logic.
- Do not write hand-made CDN URLs in development output.
- Do not use `mouseover`, `mouseout`, `mouseenter`, `mouseleave`, or `dblclick` as the default mobile interaction.
- Do not use `querySelector`, `getElementById`, timers, DOM mutation, canvas, or form/input logic.
- Do not animate attributes outside the SVG animation whitelist, such as `clip-path`, `filter`, `transform-origin`, `background-position`, `margin`, `z-index`, or `display`.

## Reference Files

Read only what is needed:

- `references/svg-authoring-spec.md`: generation rules, animation modes, parameterized templates.
- `references/svg-learned-assets.md`: learned asset table, content fingerprints, new/changed detection.
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
8. If source images are missing, use color-block placeholders with the correct dimensions and keep replacement simple.
9. For nested interactions, first model the effect as nested `<g>` groups and transparent hot zones so click events bubble to ancestor animations.
10. Check interaction quality: trigger structure, affordance, final feedback, easing choice, and anti-mistouch behavior.

## Incremental Learning Workflow

Use this when the user adds new `source/*.html` cases or asks to update the rules.

1. Run the learned asset update script first. In Codex use:
   `node .codex/skills/wechat-svg-authoring/scripts/update-learned-assets.js source`
   In Claude Code use the same script under `.claude/skills/wechat-svg-authoring/scripts/`.
2. Treat rows marked `新增` or `已变更` in `source/notes/svg-learned-assets.md` as the cases that need learning. Do not rely on filename conventions; detection is based on content fingerprints and evidence-table coverage.
3. For each new/changed case, extract evidence:
   - frequent tags
   - `viewBox` dimensions
   - image references
   - `begin` triggers
   - `attributeName`
   - `repeatCount`
   - `calcMode`
   - scroll, touch, parallax, hot-zone, link patterns
4. Update `source/notes/svg-case-evidence.md` first. This is the fact table.
5. Update `source/notes/svg-case-index.md` with layout, interaction, key techniques, reuse scenarios, and risks.
6. Update `source/notes/svg-authoring-spec.md` only if the case introduces a new reusable rule or changes an existing rule.
7. Run the learned asset update script again so handled cases become `已学习`.
8. Sync updated notes into this skill's `references/` folder and the matching Claude/Codex skill folder when present.
9. Report changed files, asset counts, and newly learned patterns.

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
