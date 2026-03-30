/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["next/core-web-vitals"],
  rules: {
    "react/display-name": "off",
  },
};

export default [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
  config,
];
