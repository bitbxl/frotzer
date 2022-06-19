/* beautify preserve:start */
var fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const _ = require('underscore');
/* beautify preserve:end */


/**
 * @external ChildProcess
 * @see {@link https://nodejs.org/api/child_process.html#child_process_class_childprocess|ChildProcess}
 */

/**
 * @external dfrotz
 * @see {@link https://gitlab.com/DavidGriffith/frotz}
 */

// -----------------------------------------------------------------------------
// FROTZER
// -----------------------------------------------------------------------------
/**
 * The constructor of the Frotzer instance. Frotzer wraps a
 * {@link external:dfrotz} process that can be controlled via a CLI. The
 * constructor optionally takes as input a {@link frotzerOpts} structure to
 * initialize the module. For some of the options, defaults are used if the
 * option is not passed (refer to the {@link frotzerOpts} documentation for a
 * list of the defaults). Some of them must be set in advance to be
 * able to start a game (e.g. the `storyfile` path).
 * @class
 * @classdesc This class contains all the methods needed to create and control a
 * Frotzer instance (which wraps a dfrotz process).
 * @return {Object} The Frotzer instance.
 * @param {frotzerOpts=} [options] The options to use for the initialization of
 * Frotzer. If they are not passed to the constructor then defaults are used.
 * @example
 * const {Frotzer} = require('@bitbxl/frotzer');
 * let options = {storyfile: 'Ruins.z5'};
 *
 * let frotzer = new Frotzer(options);
 *
 * (async () => {
 *   let responses = await frotzer.start();
 *   // responses contains:
 *   // ['[Please press SPACE to begin.]', 'Days of searching, days of thirsty
 *   // hacking through the briars of the forest, but at last your patience was
 *   // rewarded. A discovery! (etc...)']
 * })();
 */
function Frotzer(options) {

  /**
   * The internal state of Frotzer which affects its ability to start a game.
   * The state, which mainly depends on the running state of the dfrotz
   * instance, can have the following values:
   * - `idle`: a game cannot be started yet due to missing or incomplete
   * options
   * - `ready`: a game is ready to be started.
   * - `running`: a game has been already started. It can be controlled by
   * sending commands through the Frotzer instance methods.
   * @member {String}
   * @default `idle`
   */
  this.state = 'idle';

  /**
   * The data structure containing the options that are currently set in Frotzer.
   * See {@link frotzerOpts} for the meaning of each option.
   * @member {frotzerOpts}
   */
  this.options = {};
  Object.getPrototypeOf(this)._setOptions.bind(this)(options, 'Frotzer()');

  /**
   * The Node's child process in which dfrotz is running. It is `null` if a
   * game has not been started yet.
   * @member {external:ChildProcess}
   */
  this.dfrotz = null;

} // end Frotzer class


/**
 * A data structure containing data defining Frotzer's behaviour. Part of these
 * options are directly traceable to the ones passed to dfrotz via the CLI.
 * @typedef frotzerOpts
 * @type {Object}
 * @property {String} options.dfexec - The path of the executable used to launch
 *  dfrotz. The base path is the _module root_. Default is `./frotz/dfrotz`.
 * @property {String} options.dfopts - The options (in an array) to pass to dfrotz.
 *  Default is `['-m']` (this switches off the MORE prompts).
 * See [here]{@link https://gitlab.com/DavidGriffith/frotz/-/raw/master/doc/dfrotz.6}
 * for a list of the `dfrotz`'s options.
 * @property {String} options.storyfile - The storyfile to load when starting
 * dfrotz. Setting in advance  this option is obviousy mandatory to be able to
 * start a game.
 * @property {String} options.storydir - The directory containing the
 * storyfiles. The base path is the project root. Default is `./` (the project
 * root itself)
 * @property {String} options.savedir - The directory to use to store
 * and load game states. The base path is the project root. Default is `./` (the
 * project root itself)
 * @property {String} options.filter - The filter to use to render the results
 * of the commands returned by dfrotz.
 * Available options are `oneline`(all compressed in one line, no prompt),
 * `compact` (removes trailing and multiple spaces, minimizes the number of `\n\r`,
 * no prompt) and `none` (no filter applied). Default is `compact`.
 * @property {String[]} options.seq.quit - The sequence of commands executed in
 * dfrotz to quit the game. Default is `['quit', 'yes']`.
 * @property {String} options.seq.quit_endmarker - The string to use as last
 * response after the termination of the dfrotz process. Default is `<END>`.
 * @property {String[]} options.seq.save - The sequence of commands executed by
 * dfrotz to save a game state. The value `@filename` in the sequence will be
 * substituted by the filename passed to the {@link Frotzer#save} method.
 * Default is `['save', '@filename']`.
 * @property {String[]} options.seq.restore - The sequence of commands executed
 * by dfrotz to restore a game state. The value `@filename` in the sequence
 * will be substituted by the filename passed to the {@link Frotzer#restore}
 * method. Default is `['restore', '@filename']`.
 * @property {String[]} options.seq.start - The sequence of commands executed
 * just after starting dfrotz. Defaut is `['']`(empty string) meaning that it
 * will be sent just a `\n` (to skip automatically a first request to press a
 * key).
 * @property {Integer} options.seq.start_drop - The number of initial responses
 * to drop after the start. Default is `1` (this tipically removes from the
 * response(s) the dfrotz launch command displayed on the shell).
 */


// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
/**
 * This method is used to initialize Frotzer before starting a game (if not
 * done already at instantiation time using the constructor). Typically the
 * {@link frotzerOpts} structure is passed to change the options currently
 * set in Frotzer. The passed values will _overwrite_ the existing ones.
 * @async
 * @param {frotzerOpts=} [options] The options to use for the initialization
 * of Frotzer. They overwrite the existing ones.
 * @return {Promise<null>} A `null` value.
 * @throws {Error} if Frotzer is in `running` state.
 * @example
 * const {Frotzer} = require('@bitbxl/frotzer');
 * let options = {storyfile: 'Ruins.z5'};
 *
 * let frotzer = new Frotzer(options);
 *
 * (async () => {
 *   await frotzer.start();
 *   // Frotzer cannot start (no storyfile passed)
 *   await frotzer.init(options);
 *   // Frotzer is ready to start
 *   // ...
 * })();
 */
Frotzer.prototype.init = async function(options) {

  return new Promise((resolve, reject) => {

    this._setOptions(options, 'init()');

    resolve();

  });
}


// ---------------------------------------------------------------------------
// START
// ---------------------------------------------------------------------------
/**
 * This method is used to start Frotzer. When started, a dfrotz process is
 * created in the background. The process is controlled via in/out streams
 * to/from the dfrotz CLI. A {@link frotzerOps} structure can be passed to
 * overwrite the options alsready set. Note that these passed values will
 * _overwrite_ some of the currently set options before starting the dfrotz
 * process in the backgroud.
 * @async
 * @return {Promise<String[]>} The response(s) of dfrotz after the start sequence.
 * @param {frotzerOpts=} [options] The options to apply before starting
 * Frotzer. They overwrite the existing ones.
 * @throws {Error} if Frotzer is already in either in `idle` or `running` state.
 * @throws {Error} if the passed {@link frotzerOpts} are not valid or
 * incomplete.
 * @example
 * // Frotzer has been partially initialized. But no storyfile has been
 * // provided yet.
 * let options = {storyfile: 'Ruins.z5'}
 *
 * let frotzer = new Frotzer(options);
 *
 * (async () => {
 *   await frotzer.start(options);
 *   // Frotzer starts Ruins...
 *   // ...
 * })();
 */
Frotzer.prototype.start = async function(options) {

  return new Promise((resolve, reject) => {

    this._setOptions(options, 'start()');

    // options have been applied
    if (this.state === 'ready') {
      var dfargs = this.options.dfopts.slice();

      const gfopt = path.join(process.cwd(), this.options.storydir, this.options.storyfile);
      dfargs.push(gfopt);

      this.dfrotz = spawn(path.join(__dirname, this.options.dfexec), dfargs);

      this.state = 'running';

      // listener (read)
      var listener = async () => {
        let chunk;
        let chunks = '';

        while (null != (chunk = this.dfrotz.stdout.read())) {
          chunks = chunks + chunk;
        }

        var response = this._filters[this.options.filter](chunks);

        var res = await this.command(this.options.seq.start);

        resolve(_.rest([response, res[0]], this.options.seq.start_drop));

      }; // end listener

      this.dfrotz.stdout.once('readable', listener);

    } else {

      reject(new Error("start(): frotzer cannot be started (state is either 'idle' or 'running')"));
    }

  });

}

// ---------------------------------------------------------------------------
// COMMAND
// ---------------------------------------------------------------------------
/**
 * This method is used to send commands to the dfrotz background process once a
 * game is successfully started in Frotzer.
 * The commands are streamed directly to the dfrotz CLI. This method
 * accepts one or more commands in the form of multiple input arguments and/or
 * arrays of commands. An array containing the response(s) is returned.
 * @async
 * @return {Promise<String[]>} The array containing the response(s) from dfrotz
 * @param {...(String|String[])} commands The command(s) to be passed to
 * dfrotz
 * @throws {Error} if Frotzer is not in `running` state.
 * @example
 * // Frotzer is in running state.
 * //
 * // input as single argument
 * let response = await frotzer.command('pick up mushroom');
 * // returns "[You pick up the green mushroom from the ground]"
 * //
 * // input as multiple arguments
 * let responses = await frotzer.command('drop bag', 'go east');
 * // returns ["You drop your bag on the floor", "You step into the great hall of the castle..."]
 * //
 * // input as Array
 * let responses = await frotzer.command(['talk to Ada', 'hi!']);
 * // returns ["Ada turns her eyes to you and smiles", "Hey you!"]
 * //
 * // All the above apporaches can be mixed up
 */
Frotzer.prototype.command = async function(...commands) {

  commands = _.flatten(commands);

  // utility function, see next one..
  var _command = async (command) => {
    await this.send(command + '\n');

    return new Promise((resolve, reject) => {
      var response;

      // listener (read)
      var listener = () => {
        let chunk;
        let chunks = '';
        while (null != (chunk = this.dfrotz.stdout.read())) {
          chunks = chunks + chunk;
        }
        response = this._filters[this.options.filter](chunks);

        resolve(response)
      } // end listener

      this.dfrotz.stdout.once('readable', listener);

    }); // end Promise

  } // end _command

  //..this one
  return new Promise((resolve, reject) => {

    if (this.state === 'running') {

      var responses = [];

      (async () => {

        for (i = 0; i < commands.length; i++) {
          responses.push(await _command(commands[i]));
        }

        resolve(responses);

      })();

    } else {
      reject(new Error("command(): frotzer cannot receive game commands. You must start a game first"));
    }

  });

}


// ---------------------------------------------------------------------------
// SEND
// ---------------------------------------------------------------------------
/**
 * This method is used to send _raw_ text to the dfrotz background process.
 * The text is streamed directly to the dfrotz CLI. `send()` can be useful
 * when the player is requested to interact with the game using the keyboard
 * keys. To send commands it is better use the {@link Frotzer#command} method
 * which can process multiple of them at the same time.
 * @async
 * @param {frotzerOpts=} [text] The raw text to pass to the dfrotz CLI. Note that
 * an ending `\n` shall be included to have dfrotz processing the commands.
 * @return {Promise<null>} A `null` value.
 * @throws {Error} if Frotzer is not in `running` state.
 * @example
 * // dfrotz is requesting the player to use the arrow keys to control the game.
 * let upChar = String.fromCharCode(38); // arrow up
 * frotzer.send(upChar);
 * //
 * // Sending commands using send(). Remind the \n at the end.
 * frotzer.send('go west\n');
 */
Frotzer.prototype.send = async function(text) {

  return new Promise((resolve, reject) => {

    if (this.state === 'running') {

      this.dfrotz.stdin.write(text);
      resolve();

    } else {
      reject(new Error("send(): frotzer cannot receive data. You must start a game first"));
    }

  });

}


// ---------------------------------------------------------------------------
// SAVE
// ---------------------------------------------------------------------------
/**
 * This method is used to save the state of the game currently running in
 * Frotzer. `save()` executes the sequence of commands in dfrotz as specified
 * in the `seq.save` field of the {@link frotzerOpts} structure, which can be
 * customized. `save()` takes as imput the name of the file in which the game
 * state has to be stored. The directory to use can be specified in the
 * `savedir` field of the Frotzer options (see {@link frotzerOpts}). Careful, if
 * the file already exists then it is overwritten.
 * @async
 * @param {String} filename The name of the file in which the game state has
 * to be stored.
 * @return {Promise<String[]>} The response(s) of dfrotz as an array of values.
 * @throws {Error} if Frotzer is not in `running` state.
 * @example
 * // Frotzer is in running state. The default save directory in the options is
 * // './'.
 * //
 * await frotzer.save('myGame.qzl');
 * // The game state is saved in the file 'myGame.qzl' located in
 * // the project root.
 */
Frotzer.prototype.save = async function(filename) {

  return new Promise((resolve, reject) => {

    if (this.state === 'running') {

      var savepath = path.join(process.cwd(), this.options.savedir, filename);

      // Careful. If the file already exists then it is overwritten
      if (fs.existsSync(savepath)) {
        fs.unlinkSync(savepath);
      }

      const fln = (el) => el.includes('@filename');
      const i = this.options.seq.save.findIndex(fln);
      const seq = this.options.seq.save.slice();
      seq[i] = seq[i].replace('@filename', savepath);

      this.command(seq).then(res => {
        resolve(res);
      });

    } else {
      reject(new Error("save(): You must start a game before saving it"));
    }

  });

}


// ---------------------------------------------------------------------------
// RESTORE
// ---------------------------------------------------------------------------
/**
 * This method is used to restore the state of the game currently running in
 * Frotzer. `restore()` executes the sequence of commands in dfrotz as
 * specified in the `seq.restore` field of the {@link frotzerOpts} structure,
 * which can be customized. `restore()` takes as imput the name of the file
 * from  which the game state has to be restored. The direcotry to use
 * can be specified in the `savedir` field of the Frotzer options (see
 * {@link frotzerOpts}).
 * @async
 * @param {String} filename The name of the file from which the game state
 * has to be restored.
 * @return {Promise<String[]>} The response(s) of dfrotz as an array of values.
 * @throws {Error} if a file having the input filename is not existing in the
 * target directory
 * @throws {Error} if Frotzer is not in `running` state.
 * @example
 * // Frotzer is in running state. The default save directory in the options is
 * // './'.
 * //
 * await frotzer.restore('myGame.qzl');
 * // The game state is restored from the file 'myGame.qzl' located in
 * // the project root.
 */
Frotzer.prototype.restore = async function(filename) {

  return new Promise((resolve, reject) => {

    if (this.state === 'running') {

      var restpath = path.join(process.cwd(), this.options.savedir, filename);

      fs.access(restpath, (err) => {
        if (err) {
          this.quit().then(() => {
            reject(new Error("restore(): The game cannot be restored, the file doesn't exist"));
          });

        } else {

          const fln = (el) => el.includes('@filename');
          const i = this.options.seq.restore.findIndex(fln);
          const seq = this.options.seq.restore.slice();
          seq[i] = seq[i].replace('@filename', restpath);
          this.command(seq).then((res) => {
            resolve(res);
          });
        }
      });

    } else {
      reject(new Error("restore(): You must start a game before restoring a previous game state"));
    }

  });

}


// ---------------------------------------------------------------------------
// QUIT
// ---------------------------------------------------------------------------
/**
 * This method is used to quit dfrotz and move Frotzer to `ready` state.
 * `quit` executes a sequence of dfrotz commands as specified in the
 * `seq.quit` field of the {@link frotzerOpts} structure, which can be
 * customized. The last string in the response(s) returned by `quit` is a
 * default value specified by `seq.quit_endmarker` in the Frotzer's options,
 * which can be also customized.
 * @return {Promise<String[]>} The response(s) of dfrotz after the quit sequence
 * @throws {Error} if Frotzer is not in `running` state.
 * @example
 * // Frotzer is in running state.
 * //
 * await frotzer.quit();
 * // returns ["Are you sure?", "<END>"]
 */
Frotzer.prototype.quit = async function() {

  return new Promise((resolve, reject) => {

    if (this.state === 'running') {
      this.command(_.first(this.options.seq.quit, this.options.seq.quit.length - 1))
        .then((res) => {
          this.send(_.last(this.options.seq.quit) + '\n').then(() => {
            this.state = 'ready';
            resolve(_.flatten([res, this.options.seq.quit_endmarker]));
          });
        });

    } else {
      reject(new Error("quit(): You must start a game before quitting it"));
    }

  });

}


// ---------------------------------------------------------------------------
// KILL
// ---------------------------------------------------------------------------
/**
 * This method is used to kill the dfrotz process and move Frotzer to `ready`
 * state. `kill()` is another way to terminate dfrotz. Differently from
 * {@link Frotzer#quit} the termination is commanded at OS level. The state
 * is moved to `ready` at the end of the execution.
 * @async
 * @return {Promise<null>} A `null` value.
 * @throws {Error} if Frotzer is not in `running` state.
 * @example
 * // Frotzer is in running state.
 * //
 * await frotzer.kill();
 * // dfrotz process is killed, Frotzer's state is `ready`
 */
Frotzer.prototype.kill = async function() {

  return new Promise((resolve, reject) => {

    if (this.state === 'running') {

      //listener (exit)
      this.dfrotz.once('exit', (code, signal) => {
        this.state = 'ready';
        this.dfrotz = null;
        resolve();
      });

      this.dfrotz.kill();

    } else {
      reject(new Error("kill(): the frotz process cannot be killed, frotzer is not in running state"));
    }

  });

}


// UTILITIES ----------------------------------------------------------------

Frotzer.prototype._filters = {};

Frotzer.prototype._filters.compact = function(str) {
  return str
    .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
    .replace(/\s{2,}/g, ' ') // Reduce multiple \s to one
    .replace(/(\w)(\n)(\w)/g, '$1 $3') // Remove single \n inside paragraph
    .replace(/\n{2,}/g, '\n') // Reduce multiple \n\r to one
    .replace(/\s\w*>$/g, ''); // Remove cursor at the end of the line
};

Frotzer.prototype._filters.oneline = function(str) {
  return str
    .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
    .replace(/\s{2,}/g, ' ') // Reduce multiple \s to one
    .replace(/\n{1,}/g, ' ') // No \n\r, but spaces..
    .replace(/\s\w*>$/g, ''); // Remove cursor at the end of the line
};

Frotzer.prototype._filters.none = function(str) {
  return str
};

Frotzer.prototype._defOptions = {
  dfexec: './frotz/dfrotz',
  dfopts: ['-m'],
  storyfile: null,
  storydir: './',
  savedir: './',
  filter: 'compact',
  seq: {
    quit: ['quit', 'yes'],
    quit_endmarker: '<END>',
    save: ['save', '@filename'],
    restore: ['restore', '@filename'],
    start: [''],
    start_drop: 1
  }
};


// To update the state based on the current state and on the already set options
Frotzer.prototype._updateState = function() {

  if (this.state !== 'running') {

    //console.log(this.options)
    if (!_.isNull(this.options.storyfile)) {
      this.state = 'ready';
    } else {
      this.state = 'idle';
    }

  } // state shall always remain 'running' if already 'running'

} // end _updateState()

// To validate the whole options or just a fragment of them
// Return an object containing the result of the validation and the wrong key.
Frotzer.prototype._validateOptions = function(options) {

  var regexDirPath = /^\.?\/([^\/]+\/)*[^\/]*$/;

  var schemaRoot = {
    dfexec: value => regexDirPath.test(value) || _.isUndefined(value),
    dfopts: value => _.isArray(value) || _.isUndefined(value),
    storyfile: value => _.isString(value) || _.isNull(value) || _.isUndefined(value),
    storydir: value => regexDirPath.test(value) || _.isUndefined(value),
    savedir: value => regexDirPath.test(value) || _.isUndefined(value),
    filter: value => /(none|compact|oneline)/.test(value) || _.isUndefined(value),
    seq: value => _.isObject(value) || _.isUndefined(value)
  };

  var schemaSeq = {
    quit: value => _.isArray(value) || _.isUndefined(value),
    quit_endmarker: value => _.isString(value) || _.isUndefined(value),
    save: value => _.isArray(value) || _.isUndefined(value),
    restore: value => _.isArray(value) || _.isUndefined(value),
    start: value => _.isArray(value) || _.isUndefined(value),
    start_drop: value => /^[0-9]+$/.test(value) || _.isUndefined(value)
  };

  const validate = (object, schema) => Object
    .keys(schema)
    .filter(key => !schema[key](object[key]));

  var errorsSeq = [];
  const errorsRoot = validate(options, schemaRoot);
  if (!errorsRoot.includes('seq')) {
    errorsSeq = validate(options.seq, schemaSeq);
  }

  var errors = _.flatten(errorsRoot, errorsSeq);
  //console.log(options);
  if (errors.length != 0) {
    return {
      valid: false,
      key: errors[0]
    };
  } else {
    return {
      valid: true,
      key: ''
    };
  }

} // end _validateOptions()

// To set the options, changing accordingly the state.
// Throws exception errors with a message containing the originating method
Frotzer.prototype._setOptions = function(options, err_orig) {

  if (this.state === 'running') {
    throw new Error(err_orig + ': options cannot be set, state is running');
    //return false;
  }

  var inOpts = {};

  if (typeof options !== 'undefined') {
    inOpts = JSON.parse(JSON.stringify(options));
  }

  if (typeof inOpts.seq === 'undefined') {
    inOpts.seq = {};
  }

  this.options.seq = _.defaults(this.options.seq, this._defOptions.seq);
  this.options = _.defaults(this.options, this._defOptions);

  // Work on a duplicate of this.options in case a roll back is needed
  var outOpts = JSON.parse(JSON.stringify(this.options));

  // Overwrite key
  _.each(inOpts, (value, key) => {
    if (key !== 'seq') {
      outOpts[key] = value;
    }
  });
  // Overwrite seq key
  _.each(inOpts.seq, (value, key) => {
    outOpts.seq[key] = value;
  });

  var valres = this._validateOptions(outOpts);

  if (valres.valid) {
    this.options = outOpts;
    this._updateState();
  } else {
    throw new Error(err_orig + ': options cannot be set, key ' + valres.key + ' is not valid');
  }

} // end _setOptions()


// Export all as a module
exports.Frotzer = Frotzer;
