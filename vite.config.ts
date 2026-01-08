
export default defineConfig({
  base: '/skivault/',
  plugins: [react()],
  define: {
    // 强制将 process.env.API_KEY 替换为构建环境中的实际值
    // 这样既能满足 SDK 必须使用 process.env.API_KEY 的硬性要求，
    // 又能解决 Vite 默认不提供全局 process 对象的问题。
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react', '@google/genai'],
        },
      },
    },
  },
});
