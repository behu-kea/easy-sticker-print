# Sticker Studio

A local, dependency-free HTML/CSS/JavaScript app for preparing one sticker for Roland VersaWorks. PNG transparency becomes a closed vector cut contour; EPS and PDF exports embed a real **CutContour** spot color, not a process-magenta approximation.

## Open the app

Double-click **dist/Sticker Studio.html**. It is a self-contained offline file: no installation, accounts, uploads, CDN dependencies, or server required. Keep it anywhere, including a USB drive.

For development, run `npm start` and visit http://127.0.0.1:4173. Run `npm run build` after editing to rebuild the portable file. Node 18+ is sufficient. No package installation is needed.

## Workflow

1. Import a transparent PNG (recommended) or JPEG.
2. Choose Contour, Rectangle, Circle, or Ellipse. Solid-background removal flood-fills only matching areas connected to the edges; it does not perform AI subject extraction.
3. Enter the **finished cut width in millimetres**. The calculated height preserves proportions. Circles and ellipses enclose the image bounds, so their corners are not cropped. These simple shapes may leave more blank space than an automatic contour.
4. Leave Border / inset at **0** to cut along the artwork. Positive values add white space on white media. Negative values move the cut inside the artwork; −0.75 mm follows the guide’s inset example. The width remains the finished cut width when changing the border.
5. Inspect the pink preview. Disconnected islands produce separate cuts. Interior holes are excluded unless explicitly enabled. Fine-tune smoothing, transparency threshold, and island filtering as needed.
6. Export EPS (the supplied guide’s format) or PDF. Import into VersaWorks, verify its recognized cut-contour indication, keep scaling at 100%, set copies in VersaWorks, and use Print & Cut. Start with one test sticker.

## Print details and evidence

- The supplied Illustrator template’s embedded metadata and native data declare `CutContour` as a CMYK spot color: C=0, M=100, Y=0, K=0. Its artboard is 450 × 500 mm. The template was saved without PDF-compatible artwork; the app does not depend on opening it in Illustrator.
- The supplied guide, page 5, explicitly specifies a **0.25 mm** cut stroke. That is the default. It is not the same as 0.25 pt. The app also offers 0.25 pt (0.088194 mm). The template’s stored graphic-style stroke could not be independently established; the guide is the source for the default.
- Both outputs use a `/Separation /CutContour /DeviceCMYK` color space and closed, unfilled vector strokes. The alternate display color is magenta. Stroke overprint is enabled. PDF paths and image geometry use physical points (72 per inch).
- The page tightly encloses the artwork and cut paths with a 1 mm safety margin on every side. A 70 mm cut typically produces a 72 mm page, which is intentional. **Do not resize the page to 70 mm in VersaWorks**; keep 100% scaling. Insets can result in a page larger than the cut bounds because artwork remains outside the cut as bleed.
- Original artwork is retained at native cropped resolution and embedded as maximum-quality RGB JPEG. Transparency is flattened onto white. The app does not supply an ICC profile or emulate MakerLab’s RIP settings; VersaWorks controls color conversion.
- **White media only for the intended appearance.** White borders do not create white ink. Clear/colored media with a white underbase needs an `RDG_WHITE` workflow that this version does not implement.
- The cut preview stroke is intentionally enlarged for visibility. The actual export uses the selected physical stroke width.

Roland’s reference: [Performing Cutting — VersaWorks 6](https://downloadcenter.rolanddg.com/contents/manuals/VW6_USE_English/hcb1590393040395.html). It identifies the exact `CutContour` spot-color name and describes the recognized-cut preview.

## Limits

- Artwork is limited to 24 megapixels / 50 MB. Contours are traced at up to 1,400 pixels along the longest edge, then simplified using the selected physical tolerance. Inspect small details and large stickers. Offset accuracy is limited by this trace grid; the final cut width is normalized to the requested dimension.
- Contours are polygons, not hand-edited Bézier curves. Very aggressive smoothing can remove narrow details; use a lower smoothing value when needed.
- Busy photo backgrounds need removal in another tool first. Flat background removal can affect pale edges and enclosed backgrounds remain intact.
- Very thin features may disappear with insets. Separate islands can merge with positive offsets. The preview and path count show the result.
- There is no sheet nesting, perforated through-cut setting, printer control, automatic white-ink generation, or manual node editor.
- No actual VersaWorks installation or Roland printer was available during development. Import recognition, print color, blade settings, and physical alignment still require a real machine test.

## Verification

`npm test` runs geometry/export checks: exact bounds, winding and holes, diagonal-touching islands, island filtering, exact Euclidean distance, dilation/erosion, connected-background removal, alpha thresholds, PDF byte offsets, spot-color declarations, stroke units, and empty-export rejection.

Browser checks cover the sample workflow, PNG/JPEG loading, size controls, offsets, circular shapes, hole controls, invalid settings, and EPS/PDF downloads. The portable bundle is self-contained; direct file:// execution could not be tested through the app browser because its security policy permits only HTTP/HTTPS. Exported samples were independently rendered with Ghostscript/Poppler and parsed with pypdf. Ghostscript emitted a separate **CutContour** separation for the EPS.

Source files: `index.html`, `style.css`, `app.js`, `geometry.js`, `exporters.js`. `build.js` packages the offline version. `server.js` is an optional loopback-only development server. `reference/` preserves the extracted supplied template and its native metadata. `tests/output/` contains local QA artifacts.

## GitHub Pages

The app can be hosted directly from the repository's `main` branch, root folder: all CSS and JavaScript paths are relative and no server is required. In **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/(root)**. Alternatively, `npm run build` creates a self-contained `dist/index.html` and `.nojekyll` for artifact-based hosting.

The reference template and generated QA images are excluded from version control. Hosting the app does not upload users' sticker images: image processing and export still happen entirely inside their browsers.
