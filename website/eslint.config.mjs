import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import parserTs from '@typescript-eslint/parser';

export default [
  stylistic.configs.customize({
    blockSpacing: true,
    braceStyle: '1tbs',
    commaDangle: 'only-multiline',
    indent: 2,
    jsx: true,
    quoteProps: 'as-needed',
    quotes: 'single',
    semi: true,
  }),

  ///
  // Overrides from the TS + ESLint recommended configs^
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: globals.node,
      parser: parserTs,
    },
    ignores: [
      "webpack.*",
      "yarn.lock",
      "*.json",
      "*.md",
      "*.toml",
      "*.css",
      "*.scss",
      "*.js",
      "*.d.ts",
      "node_modules/",
      "dist/",
      "public/",
    ],
    rules: {
      /**
       * Unused variables are OK in function signatures that need to match an interface.
       * https://eslint.style/rules/js/no-trailing-spaces
       */
      '@stylistic/array-bracket-spacing': 'off',

      /**
       * Same line comments use multi-spaces
       * https://eslint.style/rules/js/no-multi-spaces
       */
      '@stylistic/no-multi-spaces': ['error', { ignoreEOLComments: true }],

      /**
       * Same line comments use multi-spaces
       * https://eslint.style/rules/js/max-statements-per-line
       */
      '@stylistic/max-statements-per-line': ['error', { max: 2 }],

      /**
       * Arrow functions can omit parentheses when they have exactly one parameter
       * https://eslint.style/rules/arrow-parens
       */
      '@stylistic/arrow-parens': ['error', 'as-needed']
    },
  },
];