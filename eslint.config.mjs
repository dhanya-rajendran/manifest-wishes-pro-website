import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'

// ESLint v9 flat config with JS + TypeScript support
export default [
  {
    ignores: ['node_modules', '.next', 'dist', 'next-env.d.ts', 'types/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Next.js plugin recommended rules
    plugins: {
      '@next/next': nextPlugin
    },
    settings: {
      next: {
        rootDir: '.'
      }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      // Approximate core-web-vitals upgrades locally
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/google-font-preconnect': 'error',
      '@next/next/google-font-display': 'error'
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      // Use typescript-eslint recommended severities (no local relaxations)
      // Treat warnings as errors via lint:ci script when needed
    }
  }
  ,
  {
    files: ['**/{next,postcss,tailwind}.config.{js,ts}', 'postcss.config.js', 'tailwind.config.{js,ts}', 'next.config.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        module: 'writable',
        require: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: ['prisma/**'],
    rules: {
      'no-empty': 'off'
    }
  },
  {
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules
    }
  }
]