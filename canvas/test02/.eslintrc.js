module.exports = {
  "env": {
    browser: true,
    node: true,
  },
  "extends": [
    "eslint:recommended"
  ],
  "overrides": [
  ],
  "parserOptions": {
    "ecmaVersion": 10,
    "sourceType": "module"
  },
  "rules": {
    "max-len": ["error", 256]
  }
}
