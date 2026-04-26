export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ]
  ],
  // Support both CommonJS and ES modules
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs' // Transform ES modules to CommonJS for Jest
          }
        ]
      ]
    }
  }
};
