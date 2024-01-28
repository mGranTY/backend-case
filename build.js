import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/index.mjs'],
    format: "esm",
    bundle: true,
    minify: true,
    outdir: 'dist',
    platform: "node",
    packages: "external",
    logLevel: 'info'
})