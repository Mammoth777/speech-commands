export default {
  server: {
    proxy: {
      '/whisper': {
        // target: 'http://localhost:9000/',
        target: 'http://129.211.167.112:9000/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/whisper/, ''),
      },
    },
  },
}