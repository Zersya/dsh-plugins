/**
 * Host half of the video preview bundle.
 *
 * The feature lives entirely in the browser: the Sidebar's document previews are
 * a client-side registry. This half exists so the bundle has a node-side entry —
 * registering a preview needs no Host route, because the document owner already
 * delivers the file's bytes to the selected previewer.
 */
export const inject = []

/** No Host-side work; the preview registers in the browser. */
export function apply() {}
