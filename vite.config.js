import { defineConfig } from 'vite';
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                nick: resolve(__dirname, 'nick.html'),       // Your first new HTML file
                ana: resolve(__dirname, 'ana.html'),   // Your second new HTML file
            },
        },
    },
    base: './'
});