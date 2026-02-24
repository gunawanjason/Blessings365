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
        rollupOptions: {
            input: {
                main: path.resolve(process.cwd(), 'index.html'),
                print: path.resolve(process.cwd(), 'print/index.html'),
            },
        },
    },
    publicDir: 'public',
});
