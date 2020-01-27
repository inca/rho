module.exports = {
  'extends': [
    'recommended/esnext',
    'plugin:@typescript-eslint/recommended'
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
    'modules': true
  },
  'plugins': [
    '@typescript-eslint'
  ],
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  'rules': {
    'quotes': [
      2,
      'single',
      {
        'allowTemplateLiterals': true
      }
    ],
    'no-useless-constructor': 0,  // in favor of @typescript/no-useless-constructor
    'import/prefer-default-export': 0,
    'import/no-default-export': 2,
    'import/no-namespace': 0,
    'class-methods-use-this': 0,
    'eqeqeq': [
      2,
      'always',
      {
        null: 'never'
      }
    ],
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-inferrable-types': [
      2,
      {
        ignoreParameters: true,
        ignoreProperties: true,
      }
    ],
    '@typescript-eslint/no-use-before-define': 0,
  }
}
