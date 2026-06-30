import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        registro: resolve(__dirname, 'registro.html'),
        relatorios: resolve(__dirname, 'relatorios.html'),
        configuracao: resolve(__dirname, 'configuracao.html'),
      }
    }
  }
})
