// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  test: false,
  package: {
    // package.json properties
    name: "@levischuck/tiny-encodings",
    version: Deno.args[0],
    description: "Tiny Encoding library for base64, base16 / hex",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/LeviSchuck/tiny-encodings",
    },
    bugs: {
      url: "https://github.com/levischuck/tiny-encodings/issues",
    },
    types: "./esm/index.d.ts",
    exports: {
      ".": {
        types: "./esm/index.d.ts",
        import: "./esm/index.js",
        require: "./script/index.js",
      },
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE.txt", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
