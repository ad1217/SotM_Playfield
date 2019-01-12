const { Asset } = require('parcel-bundler');

class RawStringAsset extends Asset {
  constructor(filename, options) {
    super(filename, options);
    this.type = 'js';
  }
  parse(str) {
    return JSON.stringify(str);
  }
  generate() {
    return `module.exports = ${this.ast}`;
  }
}

module.exports = RawStringAsset;
