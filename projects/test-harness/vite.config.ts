/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { resolve } from "node:path"
import checker from 'vite-plugin-checker';

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/projects/test-app',
    server: {
        port: 4200,
        host: 'localhost',
    },
    preview: {
        port: 4300,
        host: 'localhost',
    },
    plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), checker({ typescript: true })],
    build: {
        outDir: '../../dist/projects/test-app',

        emptyOutDir: true,
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        rollupOptions: {
            input: {
                appOne: resolve(__dirname, "src/root-app/index.html")
            }
        }
    },
}));
