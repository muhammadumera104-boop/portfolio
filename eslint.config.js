import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['src/scripts/**/*.js', 'src/main.js', 'src/firebase/**/*.js', 'src/shared/**/*.js', 'src/blog/**/*.js', 'src/admin/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['vite.config.js', 'eslint.config.js', 'src/render/**/*.js', 'src/data/**/*.js', 'tests/**/*.js', 'api/**/*.js', 'build/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
];
