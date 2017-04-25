const debug = require('debug')('get-meta-file');
const fs = require('fs');
const path = require('path');

module.exports = function (options) {
  options = options || { warn: true };

  var meta = null; 
  let buffer = null;

  const metaLocation = path.join(process.cwd(), '.meta');

  try {
    debug(`attempting to load .meta file with module.exports format at ${metaLocation}`);
    meta = require(metaLocation);
    debug(`.meta file found at ${metaLocation}`);
  } catch (e) {
    debug(`no module.exports format .meta file found at ${metaLocation}: ${e}`);
  }

  if (meta) return meta;

  try {
    debug(`attempting to load .meta file with json format at ${metaLocation}`);
    buffer = fs.readFileSync(metaLocation);
    debug(`.meta file found at ${metaLocation}`);
  } catch (e) {
    debug(`no .meta file found at ${metaLocation}: ${e}`);
  }

  if (buffer) {
    try {
      meta = JSON.parse(buffer.toString());
      debug(`.meta file contents parsed: ${util.inspect(meta, null, Infinity)}`);
    } catch (e) {
      debug(`error parsing .meta JSON: ${e}`);
    }
  }

  if ( ! meta && options.warn) return console.error(`No .meta file found in ${process.cwd()}. Are you in a meta repo?`);

  return meta;

};