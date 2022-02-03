module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    'linebreak-style': ['error', 'windows'],

    // Always add a trailing new line to the end of a file (clean diffs)
    'eol-last': ['error', 'unix'],

    // 2 space indentation
    '@typescript-eslint/indent': ['error', 2],
    
    // Style
    'quotes': ['error', 'single', { avoidEscape: true }],
    
    // ensures clean diffs, see https://medium.com/@nikgraf/why-you-should-enforce-dangling-commas-for-multiline-statements-d034c98e36f8
    'comma-dangle': ['error', 'always-multiline'],
    
    // Require all imported dependencies are actually declared in package.json
    'import/no-extraneous-dependencies': [
      'error',
      {
        optionalDependencies: false,    // Disallow importing optional dependencies (those shouldn't be in use in the project)
        peerDependencies: false,         // Disallow importing peer dependencies (that aren't also direct dependencies)
      },
    ],

    // Required spacing in property declarations (copied from TSLint, defaults are good)
    'key-spacing': ['error'],

    // Require semicolons
    'semi': ['error', 'always'],

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

    // Must use foo.bar instead of foo['bar'] if possible
    'dot-notation': ['error'],

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

    // Consistent spacing between curly braces
    'object-curly-spacing': ["error", "always", { "arraysInObjects": true }],
  },
};
