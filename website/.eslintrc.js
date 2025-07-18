const path = require('path');
module.exports = {
  env: {
    browser: true,
    es2023: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
    project: path.join(__dirname, '/tsconfig.json'),
  },
  plugins: [
    'import',
    'react',
    '@typescript-eslint',
  ],
  rules: {
    // disable next js warnings with using <img>
    "@next/next/no-img-element": "off",
    
    // Always add a trailing new line to the end of a file (clean diffs)
    'eol-last': [ 'error', 'unix' ],

    '@typescript-eslint/no-require-imports': [ 'error' ],

    // 2 space indentation
    '@typescript-eslint/indent': [ 'error', 2 ],

    // Variables should be used
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Style
    'quotes': [ 'error', 'single', { avoidEscape: true } ],

    // ensures clean diffs, see https://medium.com/@nikgraf/why-you-should-enforce-dangling-commas-for-multiline-statements-d034c98e36f8
    'comma-dangle': [ 'error', 'always-multiline' ],

    // Require all imported dependencies are actually declared in package.json
    'import/no-extraneous-dependencies': [
      'error',
      {
        optionalDependencies: false,    // Disallow importing optional dependencies (those shouldn't be in use in the project)
        peerDependencies: false,         // Disallow importing peer dependencies (that aren't also direct dependencies)
      },
    ],

    // Require all imported libraries actually resolve (!!required for import/no-extraneous-dependencies to work!!)
    'import/no-unresolved': [ 'error' ],

    // Require an ordering on all imports
    'import/order': ['warn', {
      groups: ['builtin', 'external'],
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],

    // Cannot import from the same module twice
    'no-duplicate-imports': ['error'],

    // Cannot shadow names
    'no-shadow': ['error'],

    // Required spacing in property declarations (copied from TSLint, defaults are good)
    'key-spacing': ['error'],

    // Require semicolons
    'semi': ['error', 'always'],

    // Don't unnecessarily quote properties
    'quote-props': ['error', 'consistent-as-needed'],

    // No multiple empty lines
    'no-multiple-empty-lines': ['error'],

    // Max line lengths
    'max-len': ['error', {
      code: 120,
      ignoreUrls: true, // Most common reason to disable it
      ignoreStrings: true, // These are not fantastic but necessary for error messages
      ignoreTemplateLiterals: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
    }],

    // One of the easiest mistakes to make
    '@typescript-eslint/no-floating-promises': ['error'],

    // Don't leave log statements littering the premises!
    'no-console': ['error'],

    // Useless diff results
    'no-trailing-spaces': ['error'],

    // Must use foo.bar instead of foo['bar'] if possible
    'dot-notation': ['error'],

    // Are you sure | is not a typo for || ?
    'no-bitwise': ['error'],

    // Member ordering
    '@typescript-eslint/member-ordering': ['error', {
      default: [
        'public-static-field',
        'public-static-method',
        'protected-static-field',
        'protected-static-method',
        'private-static-field',
        'private-static-method',

        'field',

        // Constructors
        'constructor', // = ["public-constructor", "protected-constructor", "private-constructor"]

        // Methods
        'method',
      ],
    }],
  },
};
