import * as myPlugin from "@ota-meshi/eslint-plugin";

export default [
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/coverage/",
      "**/.nyc_output/",
      "!**/.changeset/",
      "!**/.github/",
      "!**/.vscode/",
    ],
  },
  ...myPlugin.config({
    node: true,
    ts: true,
    json: true,
    yaml: true,
    prettier: true,
    packageJson: true,
  }),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/unbound-method": "off",
      "func-style": "off",
    },
  },
  {
    files: ["**/*.ts"],

    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
  {
    files: ["tools/**/*.ts"],

    rules: {
      "require-jsdoc": "off",
    },
  },
];
