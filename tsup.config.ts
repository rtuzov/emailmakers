import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/agent/agent.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
  skipNodeModulesBundle: true,
  target: 'node18',
  outDir: 'dist',
}); 