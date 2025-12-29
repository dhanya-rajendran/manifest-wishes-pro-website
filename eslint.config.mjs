import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

// ESLint v9 flat config with JS + TypeScript support
export default [
  {
    ignores: ['node_modules', '.next', 'dist', 'next-env.d.ts', 'types/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      // Keep lint actionable without blocking on existing anys
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-empty': 'off'
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
    files: ['app/api/**'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off'
    }
  }
]