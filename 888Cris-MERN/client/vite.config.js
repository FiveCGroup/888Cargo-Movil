import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const shouldObfuscate = isProduction && process.env.NODE_ENV === 'production'
  
  console.log(`🔧 Modo: ${mode}, Ofuscar: ${shouldObfuscate}`)
  
  return {
    plugins: [
      react(),
      // Solo agregar ofuscación en producción real
      ...(shouldObfuscate ? (() => {
        try {
          const JavaScriptObfuscator = require('javascript-obfuscator')
          
          return [{
            name: 'custom-obfuscator',
            apply: 'build',
            generateBundle(options, bundle) {
              // Ofuscar cada archivo JS
              Object.keys(bundle).forEach(fileName => {
                const file = bundle[fileName]
                if (file.type === 'chunk' && fileName.endsWith('.js')) {
                  console.log(`🔒 Ofuscando archivo: ${fileName}`)
                  
                  try {
                    const obfuscated = JavaScriptObfuscator.obfuscate(file.code, {
                      compact: true,
                      controlFlowFlattening: true,
                      controlFlowFlatteningThreshold: 0.75,
                      deadCodeInjection: true,
                      deadCodeInjectionThreshold: 0.4,
                      debugProtection: true,
                      debugProtectionInterval: 4000,
                      disableConsoleOutput: true,
                      identifierNamesGenerator: 'hexadecimal',
                      log: false,
                      numbersToExpressions: true,
                      renameGlobals: false,
                      selfDefending: true,
                      simplify: true,
                      splitStrings: true,
                      splitStringsChunkLength: 5,
                      stringArray: true,
                      stringArrayCallsTransform: true,
                      stringArrayEncoding: ['base64'],
                      stringArrayIndexShift: true,
                      stringArrayRotate: true,
                      stringArrayShuffle: true,
                      stringArrayWrappersCount: 2,
                      stringArrayWrappersChainedCalls: true,
                      stringArrayWrappersParametersMaxCount: 4,
                      stringArrayWrappersType: 'function',
                      stringArrayThreshold: 0.75,
                      transformObjectKeys: true,
                      unicodeEscapeSequence: false,
                    })
                    
                    file.code = obfuscated.getObfuscatedCode()
                  } catch (err) {
                    console.warn(`⚠️ No se pudo ofuscar ${fileName}:`, err.message)
                  }
                }
              })
            }
          }]
        } catch (error) {
          console.warn('⚠️ Plugin de ofuscación no disponible, construyendo sin ofuscación')
          return []
        }
      })() : [])
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://192.168.58.115:4000',
          changeOrigin: true,
          secure: false
        },
        '/code-docs': {
          target: 'http://192.168.58.115:4000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      // Configuración adicional para producción
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: shouldObfuscate, // Solo eliminar console.log si se ofusca
          drop_debugger: shouldObfuscate // Solo eliminar debugger si se ofusca
        }
      } : {},
      rollupOptions: {
        output: {
          // Ofuscar nombres de archivos solo si se ofusca
          ...(shouldObfuscate ? {
            entryFileNames: 'assets/[hash].js',
            chunkFileNames: 'assets/[hash].js',
            assetFileNames: 'assets/[hash].[ext]'
          } : {
            entryFileNames: 'assets/[name].js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: 'assets/[name].[ext]'
          })
        }
      }
    }
  }
})
