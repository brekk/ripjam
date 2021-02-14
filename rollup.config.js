import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import pkg from './package.json'

const plugins = () => [
  json(),
  resolve(),
  commonjs({
    include: /node_modules/,
    // dynamicRequireTargets: [
    //   'node_modules/espree/lib/*.js',
    //   'node_modules/espree/espree.js',
    //   'node_modules/@babel/eslint-parser/lib/**/*.js'
    // ]
  })
]

const dir = __dirname
export default [
  {
    input: 'src/index.js',
    plugins: plugins(),
    output: { file: pkg.module, format: 'es' }
  },
  {
    input: 'src/index.js',
    plugins: plugins(),
    output: { file: pkg.main, format: 'cjs' }
  },
  {
    input: 'src/testing-tools.js',
    plugins: plugins(),
    output: { file: 'test.mjs', format: 'es' }
  },
  {
    input: 'src/testing-tools.js',
    plugins: plugins(),
    output: { file: 'test.js', format: 'cjs' }
  }
]
