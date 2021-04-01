module.exports = {
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeEditorsNSData',
    'convertColors',
    'convertStyleToAttrs',
    'removeUselessStrokeAndFill',
    'removeUnknownsAndDefaults',
    // These are better handled by https://github.com/scour-project/scour/
    // 'convertPathData',
    // 'convertTransform',
    // 'cleanupNumericValues',
    {
      name: 'removeAttrs',
      params: {
        attrs: ['fill-rule', 'stroke', 'stroke-width', 'font-family']
      }
    } 
  ],
  js2svg: {
    indent: 1, // string with spaces or number of spaces. 4 by default
    pretty: true, // boolean, false by default
  }
}
