const { gray, green, yellow, underline } = require('chalk');
const debug = require('debug')('get-meta-file');
const dedent = require('dedent');
const findUpsync = require('findup-sync');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const tildify = require('tildify');
const util = require('util');

const CWD_NOT_META = yellow('warn: ') + 'The current directory is ' + underline('not') + ' a meta repo';

const warnMissing = (cwd) => dedent`
  ${CWD_NOT_META}:
    ${gray(tildify(cwd))}

  And none of your ancestors are meta repos, either.
`;

module.exports = function (options = {}) {
  options.warn = options.warn !== false;

  const cwd = process.cwd();
  const inMetaRepo = fs.existsSync('.meta');
  const metaPath = inMetaRepo ? path.resolve('.meta') : findUpsync('.meta', { cwd });

  if (!metaPath) {
    if (options.warn) console.warn(warnMissing(cwd));
    return null;
  }

  if (options.confirmInMetaRepo && !inMetaRepo) {
    console.log(dedent`
      ${CWD_NOT_META}:
        ${gray(tildify(cwd))}

      The closest meta repo is:
        ${gray(tildify(metaPath))}

      Would you like to:
        - continue in the closest meta repo? ${green('[y/enter]')}
        - continue in the current directory? ${green('[c]')}
        - cancel and exit? ${green('[x]')}

    `);

    let answer = prompt();
    if (answer == null) answer = 'x';
    else answer = answer.toLowerCase() || 'y';

    if (answer === 'x') process.exit(0);
    if (answer === 'y') process.chdir(path.dirname(metaPath));
  }

  try {
    debug(`attempting to load .meta file with module.exports format at ${metaPath}`); // prettier-ignore
    const meta = require(metaPath);
    debug(`.meta file found at ${metaPath}`);
    if (meta) return meta;
  } catch (e) {
    debug(`no module.exports format .meta file found at ${metaPath}: ${e}`);
  }

  let buffer = null;
  try {
    debug(`attempting to load .meta file with json format at ${metaPath}`);
    buffer = fs.readFileSync(metaPath);
    debug(`.meta file found at ${metaPath}`);
  } catch (e) {
    debug(`no .meta file found at ${metaPath}: ${e}`);
  }

  if (buffer) {
    try {
      const meta = JSON.parse(buffer.toString());
      debug(`.meta file contents parsed: ${util.inspect(meta, null, Infinity)}`); // prettier-ignore
      return meta;
    } catch (e) {
      debug(`error parsing .meta JSON: ${e}`);
    }
  }

  if (options.warn) console.warn(warnMissing(cwd));
  return null;
};

module.exports.getFileLocation = function () {
  return findUpsync('.meta', { cwd: process.cwd() });
};

module.exports.format = function (meta) {
  return JSON.stringify(meta, null, 2) + '\n';
};

module.exports.save = function (meta) {
  fs.writeFileSync(module.exports.getFileLocation(), module.exports.format(meta));
};
