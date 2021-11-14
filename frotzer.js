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
 * @external Frotz
 * @see {@link https://gitlab.com/DavidGriffith/frotz}
 */

// -----------------------------------------------------------------------------
// FROTZER
// -----------------------------------------------------------------------------
/**
 * The constructor of the Frotzer instance. Frotzer is backed (i.e. wraps) by a
 * {@link external:Frotz} (dfrotz) process controlled via a CLI. The
 * constructor optionally takes as input the {@link frotzerOpts} structure to
 * initialize the module. For some of the options, defaults are used if the
 * value is not passed (refer to the {@link frotzerOpts} documentation for a
 * list of the defaults). Some of them must be set in advance in order to be
 * able to start a game (e.g. the `gamefile`).
 * @class
 * @classdesc This class contains all the methods needed to create and control a
 * Frotzer instance (which wraps a dfrotz process).
 * @return {Object} The Frotzer instance.
 * @param {frotzerOpts=} [options] The options to use for the initialization of
 * Frotzer. If they are not passed to the constructor then defaults are used.
 * @example
 * const {Frotzer} = require('./frotzer');
 * let options = {gamefile: 'Ruins.z5'};
 *
 * let frotzer = new Frotzer(options);
 * // Some of the options fields are set to default values
 *
 * (async () => {
 *   let responses = await frotzer.start();
 *   // ['[Please press SPACE to begin.]', 'Days of searching, days of thirsty
 *   // hacking through the briars of the forest, but at last your patience was
 *   // rewarded. A discovery! (etc...)']
 * })();
 */
function Frotzer(options) {


  this._updState = function() {

    var genOptKeys = ['dfexec', 'dfopts', 'gamefile', 'savedir', 'filter'];
    var seqOptKeys = ['quit', 'quit_endmarker', 'save', 'restore', 'start', 'start_drop'];

    var genChk = _.every(genOptKeys, key => {
      return _.has(this.options, key) && !_.isNull(this.options[key])
    });

    var seqChk = _.every(seqOptKeys, key => {
      return _.has(this.options.seq, key) && !_.isNull(this.options.seq[key])
    });

    this.state = (genChk && seqChk) ? 'ready' : 'idle';

  }


  this._owOptions = function(options) {

    if (this.state === 'running') {
      return false;
    }

    if (typeof options === 'undefined') {
      options = {};
    }

    if (typeof options.seq === 'undefined') {
      options.seq = {};
    }

    _.each(options, (value, key) => {
      if (key !== 'seq') {
        this.options[key] = value;
      }
    });

    _.each(options.seq, (value, key) => {
      this.options.seq[key] = value;
    })

    this._updState();
    return true;

  }

  /**
   * The internal state of Frotzer which affects the ability to start a game.
   * The state, which mainly depends on the running state of the dfrotz
   * instance, can have the following values:
   * - `idle`: a game cannot be started yet due to missing or incomplete
   * options
   * - `ready`: a game is ready to be started.
   * - `running`: a game has been already started. It can be controlled by
   * sending commands through the interface.
   * @member {String}
   * @default `idle`
   */
  this.state = 'idle';
  /**
   * The options currently set in Frotzer. See {@link frotzerOpts} for the
   * details.
   * @member {frotzerOpts}
   */
  this.options = createOptions(options);
  this._updState();
  /**
   * The Node's child process in which dfrotz is running. It is `null` if a
   * game has not been started yet.
   * @member {external:ChildProcess}
   */
  this.dfrotz;


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
   * @throws {Error} if Frotzer is in `running` state.
   * @example
   * // Frotzer has been instantiated with some options passed via the
   * // constructor
   * let options = {gamefile: 'Ruins.z5'}
   * //
   * await frotzer.init(options);
   * // Frotzer is ready to start
   */
  this.init = async (options) => {

    return new Promise((resolve, reject) => {

      if (this._owOptions(options)) {

        resolve();

      } else {
        //  this.kill().then(() => {
        reject(new Error("init(): A game is already running in frotzer. You  must quit before re-initializing it."));
        //});
      }

    });
  }


  // ---------------------------------------------------------------------------
  // START
  // ---------------------------------------------------------------------------
  /**
   * This method is used to start Frotzer. When started, a dfrotz process is
   * created in the background. The process is controlled via in/out streams
   * to/from the dfrotz CLI. A {@link frotzerOps} structure can be passed to
   * overwrite the existing ones. Note that these passed values will
   * _overwrite_ some of the currently set options.
   * @async
   * @return {String[]} The response(s) of dfrotz after the start sequence
   * (either a single value or an array of values)
   * @param {frotzerOpts=} [options] The options to apply before starting
   * Frotzer. They overwrite the existing ones.
   * @throws {Error} if Frotzer is already in `running` state.
   * @throws {Error} if the passed {@link frotzerOpts} are not valid or
   * incomplete.
   * @example
   * // Frotzer has been partially initialized. But no gamefile has been
   * // provided yet.
   * let options = {gamefile: 'Ruins.z5'}
   * //
   * await frotzer.start(options);
   * // Frotzer starts Ruins...
   */
  this.start = async function(options) {

    return new Promise((resolve, reject) => {

      var currOptions = this.options; // to rollback

      if (this._owOptions(options)) {

        // options are valid
        if (this.state === 'ready') {


          var dfargs = this.options.dfopts.slice();
          const gfopt = path.join(__dirname, this.options.gamefile);
          dfargs.push(gfopt);

          this.dfrotz = spawn(path.join(__dirname, this.options.dfexec), dfargs);
          this.state = 'running';

          // listener (read)
          var listener = () => {
            let chunk;
            let chunks = '';

            while (null != (chunk = this.dfrotz.stdout.read())) {
              chunks = chunks + chunk.toString();
            }

            var response = this._filters[this.options.filter](chunks);

            this.command(this.options.seq.start).then(res => {
              resolve(_.rest(_.flatten([response, res]), this.options.seq.start_drop - 1));
            });

          };

          this.dfrotz.stdout.once('readable', listener);


        } else {

          // options not valid for starting: rolling back
          this._owOptions(currOptions);
          reject(new Error("start(): frotzer cannot be started (options not valid)"));
        }

        // options are not applicable
      } else {
        //this.kill().then(() => {
        reject(new Error("start(): frotzer cannot be started (already running)"));
        //});
      }

    });

  }


  // ---------------------------------------------------------------------------
  // COMMAND
  // ---------------------------------------------------------------------------
  /**
   * This method is used to send commands to the dfrotz background process.
   * The commands are streamed directly to the dfrotz CLI. This method
   * accepts one or more commands in the form of multiple input arguments and/or
   * arrays of commands. In case of a single command is passed, this method
   * returns the dfrotz response. If multiple commands are passed then an
   * array containing all the responses is returned.
   * @async
   * @return {Promise} The response(s) of dfrotz (either a single value or an
   * array of values)
   * @param {...(String|String[])} commands The command(s) to be passed to
   * dfrotz
   * @throws {Error} if Frotzer is not in `running` state.
   * @example
   * // Frotzer is in running state.
   * //
   * // input as single argument - output as String
   * let response = await frotzer.command('pick up mushroom');
   * // returns "You pick up the green mushroom from the ground"
   * //
   * // input as multiple arguments - output as Array
   * let responses = await frotzer.command('drop bag', 'go east');
   * // returns ["You drop your bag on the floor", "You step into the great hall of the castle..."]
   * //
   * // input as Array - output as Array
   * let responses = await frotzer.command(['talk to Ada', 'hi!']);
   * // returns ["Ada turns her eyes to you and smiles", "Hey you!"]
   * //
   * // All the above apporaches can be mixed up
   */
  this.command = async function(...commands) {

    commands = _.flatten(commands);

    // utilty function, see next one..
    var _command = async (command) => {

      return new Promise((resolve, reject) => {
        var response;

        // listener (read)
        var listener = () => {
          let chunk;
          let chunks = '';

          while (null != (chunk = this.dfrotz.stdout.read())) {
            chunks = chunks + chunk.toString();
          }

          response = this._filters[this.options.filter](chunks);
          resolve(response)
        }

        this.dfrotz.stdout.once('readable', listener);
        this.send(command + '\n');

      });
    }

    //..this one
    return new Promise((resolve, reject) => {

      if (this.state === 'running') {

        var responses = [];

        (async () => {
          for (i = 0; i < commands.length; i++) {
            responses.push(await _command(commands[i]));
          }

          if (responses.length == 1) {
            resolve(responses[0]);
          } else {
            resolve(responses);
          }

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
   * when the player is requested to interact with the game by using keyboard
   * keys. To send commands it is better use the {@link Frotzer#command} method
   * which can process multiple of them at the same time.
   * @async
   * @param {frotzerOpts=} [text] The raw text to pass to dfrotz. Note that an
   * ending `\n` shall be included to have dfrotz processing the commands.
   * @throws {Error} if Frotzer is not in `running` state.
   * @example
   * // dfrotz requests the player to use the arrow keys to control the game.
   * let upChar = String.fromCharCode(38); // arrow up
   * frotzer.send(upChar);
   * //
   * // Sending commands using send()
   * frotzer.send('go west\n');
   */
  this.send = async function(text) {

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
   * state has to be stored. The base directory to use can be specified in the
   * `savedir` field of the Frotzer options (see {@link frotzerOpts}).
   * @async
   * @param {String} filename The name of the file in which the game state has
   * to be stored.
   * @return {Promise} The response(s) of dfrotz (either a single value or an
   * array of values)
   * @throws {Error} if Frotzer is not in `running` state.
   * @example
   * // Frotzer is in running state. The default base dir in the options is
   * // '.saves'.
   * //
   * await frotzer.save('myGame.qzl');
   * // The game state is saved in the file `saves/myGame.qzl` located in
   * // the module root.
   */
  this.save = async function(filename) {

    return new Promise((resolve, reject) => {

      if (this.state === 'running') {

        var savedir = path.join(__dirname, this.options.savedir, filename);

        if (fs.existsSync(savedir)) {
          fs.unlinkSync(savedir);
        }

        const fln = (el) => el.includes('@filename');
        const i = this.options.seq.save.findIndex(fln);
        const seq = this.options.seq.save.slice();
        seq[i] = seq[i].replace('@filename', savedir);

        this.command(seq).then((res) => {
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
   * from  which the game state has to be restored. The base direcotry to use
   * can be specified in the `savedir` field of the Frotzer options (see
   * {@link frotzerOpts}).
   * @async
   * @param {String} filename The name of the file from which the game state
   * has to be restored.
   * @return {Promise} The response(s) of dfrotz (either single value or an
   * array of values)
   * @throws {Error} if a file having the input filename is not existing.
   * @throws {Error} if Frotzer is not in `running` state.
   * @example
   * // Frotzer is in running state. The default base dir in the options is
   * // '.saves'.
   * //
   * await frotzer.restore('myGame.qzl');
   * // The game state is restored from the file `saves/myGame.qzl` located in
   * // the module root.
   */
  this.restore = async function(filename) {

    return new Promise((resolve, reject) => {

      if (this.state === 'running') {

        var restpath = path.join(__dirname, this.options.savedir, filename);

        fs.access(restpath, (err) => {
          if (err) {
            this.kill().then(() => {
              reject(new Error("restore(): The game cannot be restored, the file doesn't exist"));
            });

          } else {

            const fln = (el) => el.includes('@filename');
            const i = this.options.seq.restore.findIndex(fln);
            const seq = this.options.seq.restore;
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
   * This method is used to quit dfrotz and pass Frotzer to `ready` state.
   * `quit` executes a sequence of dfrotz commands as specified in the
   * `seq.quit` field of the {@link frotzerOpts} structure, which can be
   * customized. The last string in the response(s) returned by `quit` is a
   * default value specified by `seq.quit_endmarker` in the Frotzer's options,
   * which can be also customized.
   * @return {Promise} The response(s) of dfrotz after the quit sequence
   * followed by an end marker
   * @throws {Error} if Frotzer is not in `running` state.
   * @example
   * // Frotzer is in running state.
   * //
   * await frotzer.quit();
   * // returns ["Are you sure?", "<END>"]
   */
  this.quit = async function() {

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
   * This method is used to kill the dfrotz process and pass Frotzer to `ready`
   * state. `kill()` is another way to terminate dfrotz. Differently from
   * {@link Frotzer#quit} the termination is commanded at OS level. The state
   * is moved to `ready` at the end of the execution.
   * @async
   * @throws {Error} if Frotzer is not in `running` state.
   * @example
   * // Frotzer is in running state.
   * //
   * await frotzer.kill();
   * // dfrotz process is killed, Frotzer's state is `ready`
   */
  this.kill = async function() {

    return new Promise((resolve, reject) => {

      if (this.state === 'running') {

        //listener (close)
        this.dfrotz.once('close', (code, signal) => {
          this.state = 'ready';
          resolve();
        });

        this.dfrotz.kill();

      } else {
        reject(new Error("kill(): the frotz process cannot be killed, frotzer is not in running state"));
      }

    });

  }


  function createOptions(options) {

    if (typeof options === 'undefined') {
      options = {};
    }

    if (typeof options.seq === 'undefined') {
      options.seq = {};
    }

    var defGenOpts = {
      dfexec: './frotz/dfrotz',
      dfopts: ['-m'],
      gamefile: null,
      savedir: './saves',
      filter: 'compact'
    }

    var defSeqOpts = {
      quit: ['quit', 'yes'],
      quit_endmarker: '<END>',
      save: ['save', '@filename'],
      restore: ['restore', '@filename'],
      start: [''],
      start_drop: 1
    }

    var newOpts = _.defaults(options, defGenOpts);
    newOpts.seq = _.defaults(options.seq, defSeqOpts);
    return newOpts;

  }

} // end Frotzer class



/**
 * A data structure defining Frotzer's behaviour. Part of these options are
 * directly traceable to the ones passed to dfrotz via the CLI.
 * @typedef frotzerOpts
 * @type {Object}
 * @property {String} options.dfexec - The path of the executable used to launch
 *  dfrotz. The base path is the module root. Default is `./frotz/dfrotz`.
 * @property {String} options.dfopts - The options (array) to pass to dfrotz.
 *  Default is `['-m']` (this switches off the MORE prompts). See [here]{@link https://gitlab.com/DavidGriffith/frotz/-/raw/master/doc/dfrotz.6} for a list
 * of the `dfrotz`'s options.
 * @property {String} options.gamefile - The gamefile to load when starting
 * dfrotz. Providing this option is obviousy required to be able to start a
 * game. The base directory is the one specified in the `savedir` field of the
 * options (module root as base path).
 * @property {String} options.savedir - The base directory to use when storing
 * and loading gamefiles. The base path is the module root. Default is `./
 * saves`.
 * @property {String} options.filter - The filter to use to render the result
 * of the commands returned by dfrotz.
 * Available options are `oneline`(all compressed in one line, no prompt),
 * `compact` (removes trailing spaces, minimizes the number of `\n\r`, no
 * prompt) and `none` (no filter applied). Default is `compact`.
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
 * just after starting dfrotz. Defaut is `''`(empty string) meaning that il
 * will be sent just a `\n` (to skip automatically a first request to press a
 * key).
 * @property {String} options.seq.start_drop - The number of initial response
 * lines to drop after a start. Default is `1` (this tipically removes from the
 * response(s) the dfrotz launch command displayed on the shell).
 */


Frotzer.prototype._filters = {};

Frotzer.prototype._filters.compact = function(str) {
  return str
    .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
    .replace(/(\w)(\n)(\w)/g, '$1 $3') // Remove single \n inside paragraph
    .replace(/\n{2,}/g, '\n') // Reduce multiple \n\r to one
    .replace(/\s\w*>$/g, ''); // Remove cursor at the end of the line
};

Frotzer.prototype._filters.oneline = function(str) {
  return str
    .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
    .replace(/\n{1,}/g, ' ') // No \n\r, spaces..
    .replace(/\s\w*>$/g, ''); // Remove cursor at the end of the line
};

Frotzer.prototype._filters.none = function(str) {
  return str
};


exports.Frotzer = Frotzer;
