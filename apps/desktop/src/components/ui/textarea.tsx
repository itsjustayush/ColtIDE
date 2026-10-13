// Local shim — re-exports Textarea from @colt/ui. The legacy `error?: boolean`
// prop is preserved via a deprecated alias on the @colt/ui primitive, so
// existing call sites continue to compile.
export { Textarea } from "@colt/ui";
