const chalk = require('chalk');
const debug = require('debug')('get-meta-file');
const findUpsync = require('findup-sync');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const util = require('util');

module.exports = function (options) {
  options = options || { warn: true };
  let confirmInMetaRepo = options.confirmInMetaRepo;

  var meta = null;
  let buffer = null;

  const metaLocation =
    fs.existsSync(path.join(process.cwd(), '.meta'))
      ? path.join(process.cwd(), '.meta')
      : findUpsync('.meta', { cwd: process.cwd() });

  const warning = chalk.red('\nYou are not currently in a meta repo!\n');

  if (!metaLocation) {
    console.log(warning);
    process.exit(1);
  }

  try {
    debug(`attempting to load .meta file with module.exports format at ${metaLocation}`);
    meta = require(metaLocation);
    debug(`.meta file found at ${metaLocation}`);
  } catch (e) {
    debug(`no module.exports format .meta file found at ${metaLocation}: ${e}`);
  }

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

  if (!meta && options.warn) return console.error(`No .meta file found in ${process.cwd()}. Are you in a meta repo?`);

  if (confirmInMetaRepo) {
    debug(`confirmInMetaRepo ${confirmInMetaRepo} meta ${JSON.stringify(meta)}`)
    confirmInMetaRepo = confirmInMetaRepo && !(meta['options'] && meta['options']['useParentMeta']);
    debug(`confirmInMetaRepo ${confirmInMetaRepo}`)
  }

  if (path.dirname(metaLocation) !== process.cwd()) {

    if (confirmInMetaRepo) {

      const question = `We found a meta repo in ${metaLocation}. Would you like to...\n\n\trun the command from ${metaLocation} (y or enter)\n\tcancel and exit (x) ?\n\n\t(y/x)`;
      const message = `${warning}\n${question}`;

      const yes = prompt(message).toLowerCase();

      if (yes === 'x') return process.exit(0);
      if ( ! yes || yes.toLowerCase() === 'y') {
        process.chdir(path.dirname(metaLocation));
      }

    }
    else {
      process.chdir(path.dirname(metaLocation));
    }

  }

  return meta;
};

module.exports.getFileLocation = function () {
  return findUpsync('.meta', { cwd: process.cwd() });
}