import {defineConfig} from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  base: './',
  plugins: [
    mkcert()
  ],
  server: {
    https: true
  }
})
