import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function printRoutePlugin() {
    const printDir = path.resolve(process.cwd(), 'print');
    const printIndex = path.join(printDir, 'index.html');

    const servePrint = (req, res, next) => {
        const url = req.url || '/';
        const cleanUrl = url.split('?')[0];

        if (cleanUrl === '/print' || cleanUrl === '/print/' || cleanUrl === '/print/index.html') {
            if (!fs.existsSync(printIndex)) return next();
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(printIndex, 'utf-8'));
            return;
        }

        if (cleanUrl.startsWith('/print/')) {
            const relativePath = cleanUrl.slice('/print/'.length);
            const requestedPath = path.resolve(printDir, relativePath);

            if (!requestedPath.startsWith(printDir)) return next();
            if (!fs.existsSync(requestedPath) || !fs.statSync(requestedPath).isFile()) return next();

            res.end(fs.readFileSync(requestedPath));
            return;
        }

        next();
    };

    return {
        name: 'serve-print-route',
        configureServer(server) {
            server.middlewares.use(servePrint);
        },
        configurePreviewServer(server) {
            server.middlewares.use(servePrint);
        },
    };
}

export default defineConfig({
    plugins: [printRoutePlugin()],
    server: {
        port: 5173,
        open: false,
        middlewareMode: false,
    },
    build: {
        outDir: 'dist',
        // Vite 6 defaults to "baseline-widely-available" (Safari 16+), which
        // breaks for users still on iOS 15 (iPhone 6s/7/SE 1st gen) — the page
        // renders only the body background because the bundle fails to parse.
        // Pin the target so esbuild transpiles any newer syntax down.
        target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
        cssTarget: ['safari14', 'chrome87', 'firefox78'],
        rollupOptions: {
            input: {
                main: path.resolve(process.cwd(), 'index.html'),
                print: path.resolve(process.cwd(), 'print/index.html'),
            },
        },
    },
    publicDir: 'public',
});
