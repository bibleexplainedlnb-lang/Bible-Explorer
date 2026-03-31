module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/artifacts/nextjs-site/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/node_modules__pnpm_6ac99c3d._.js",
  "build/chunks/[root-of-the-server]__f0ef0797._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/artifacts/nextjs-site/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];