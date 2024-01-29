import * as esbuild from 'esbuild';
import copyStaticFiles from 'esbuild-copy-static-files'


await esbuild.build({
    entryPoints: ['src/index.mjs'],
    format: "esm",
    bundle: true,
    minify: true,
    outdir: 'dist',
    platform: "node",
    packages: "external",
    logLevel: 'info',
    plugins: [copyStaticFiles({
        src: 'public/assets/standard_fonts',
        dest: 'dist/standard_fonts',
        dereference: true,
        errorOnExist: false,
        preserveTimestamps: true,
        recursive: true,
    })],
});