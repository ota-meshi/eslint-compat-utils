# eslint-compat-utils

***This package is still in the experimental stage.***

Provides an API for ESLint custom rules that is compatible with the latest ESLint even when using older ESLint.

## Installation

```bash
npm install --save-dev eslint-compat-utils
```

## Usage

```js
const { getSourceCode } = require("eslint-compat-utils");
module.exports = {
  meta: { /* ... */ },
  create(context) {
    const sourceCode = getSourceCode(context)
    return {
      "Program"(node) {
        const scope = sourceCode.getScope(node);
      },
    };
  },
}
```

### API

#### `getSourceCode(context)`

Returns the `SourceCode` object for the given `context`.

#### `getCwd(context)`

Returns the `cwd` option passed to the Linter.

#### `getFilename(context)`

Returns the filename associated with the source.

#### `getPhysicalFilename(context)`

When linting a file, it returns the full path of the file on disk without any code block information.
When linting text, it returns the value passed to —stdin-filename or `<text>` if not specified.
