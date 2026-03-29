import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

function getAppVersion(): string {
  const major = 0;
  try {
    const mergeLog = execSync('git log origin/main --oneline --merges --grep="Merge pull request" -1', { encoding: 'utf-8' }).trim();
    const prMatch = mergeLog.match(/#(\d+)/);
    const prNumber = prMatch ? parseInt(prMatch[1], 10) : 0;
    const mergeHash = mergeLog.split(' ')[0];
    const commitCount = mergeHash
      ? parseInt(execSync(`git rev-list ${mergeHash}..origin/main --count`, { encoding: 'utf-8' }).trim(), 10)
      : 0;
    return `${major}.${prNumber}.${commitCount}`;
  } catch {
    return `${major}.0.0`;
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getAppVersion()),
  },
  plugins: [tailwindcss(), react()],
  build: {
    cssTarget: ['chrome80', 'safari14', 'firefox80'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (!proxyReq.getHeader('x-ms-client-principal')) {
              const mockPrincipal = Buffer.from(JSON.stringify({
                identityProvider: 'aad',
                userId: 'dev-user-123',
                userDetails: 'dev@outlook.com',
                userRoles: ['anonymous', 'authenticated'],
              })).toString('base64');
              proxyReq.setHeader('x-ms-client-principal', mockPrincipal);
            }
          });
        },
      },
    },
  },
})
