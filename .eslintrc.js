module.exports = {
  parserOptions: {
    parser: '@babel/eslint-parser', 
    requireConfigFile: false, 
    ecmaVersion: 2020, 
    sourceType: 'module', 
  },
  env: {
    browser: true, 
    node: true, 
    es6: true, 
  },
  extends: [
    'plugin:vue/vue3-recommended', 
    'eslint:recommended', 
  ],
  rules: {    
    'vue/multi-word-component-names': 'off', 
  },
};