import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import uglify from 'rollup-plugin-uglify';
import closure from 'rollup-plugin-closure-compiler-js';
import replace from 'rollup-plugin-replace';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import cssnano from 'cssnano';

var isProduction = process.env.NODE_ENV === 'production';

export default {
  entry: 'src/scripts/main.js',
  format: 'iife',
  dest: './build/js/bundle.js',
  sourceMap: !isProduction ? 'inline' : false,
  moduleName: 'RollupBundle',
  plugins: [
    nodeResolve(),
    commonjs(),
    (!isProduction && serve('build')),
    eslint({
      exclude: [
        'src/styles/**',
      ]
    }),
    babel({
      exclude: ['node_modules/**', 'src/styles/**']
    }),
    postcss({
      extensions: [ '.css' ],
      plugins: [cssnano()]
    }),
    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    (isProduction && uglify()),
    (isProduction && closure())
  ]
};

