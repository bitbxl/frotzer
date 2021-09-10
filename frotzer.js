/* v0.3

/* beautify preserve:start */

var fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const _ = require('underscore');

/* beautify preserve:end */


function frotzer(options) {

    this.state = 'idle';
    this.options;
    this.dfrotz;


    // ---------------------------------------------
    // INIT
    // ---------------------------------------------
    this.init = async (options) => {

        return new Promise((resolve, reject) => {

            if (this._setOptions(options)) {

                resolve();

            } else {
                this.kill().then(() => {
                    reject(new Error("init(): A game is already running in frotzer. You must quit before re-initializing it."));
                });
            }

        });
    }



    // ---------------------------------------------
    // START
    // ---------------------------------------------
    this.start = async function(options) {

        return new Promise((resolve, reject) => {

            var currOptions = this.options; // to rollback

            if (this._setOptions(options)) {

                // options are valid
                if (this.state === 'ready') {

                    var dfargs = this.options.dfopts;
                    const gfopt = this.options.gamefile ? path.join(__dirname, this.options.gamefile) : null;
                    if (gfopt)
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
                    this._setOptions(currOptions);
                    reject(new Error("start(): frotzer cannot be started (options not valid)"));
                }

                // options are not applicable
            } else {
                this.kill().then(() => {
                    reject(new Error("start(): frotzer cannot be started (already running)"));
                });
            }

        });

    }


    // ---------------------------------------------
    // COMMAND
    // --------------------------------------------- 
    this.command = async function(...commands) {


        commands = _.flatten(commands);

        // utilty function see next one..
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

                this.dfrotz.stdin.write(command + '\n');

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


    // ---------------------------------------------
    // QUIT
    // ---------------------------------------------
    this.quit = async function() {

        return new Promise((resolve, reject) => {

            if (this.state === 'running') {
                this.command(_.first(this.options.seq.quit, this.options.seq.quit.length - 1))
                    .then((res) => {
                        this._send(_.last(this.options.seq.quit) + '\n');
                        this.state = 'ready';
                        resolve(_.flatten([res, this.options.seq.quit_endmarker]));
                    });

            } else {
                this.kill().then(() => {
                    reject(new Error("quit(): You must start a game before quitting it"));
                });
            }

        });

    }


    // ---------------------------------------------
    // KILL
    // ---------------------------------------------
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


    // ---------------------------------------------
    // SAVE
    // ---------------------------------------------
    this.save = async function(filename) {

        return new Promise((resolve, reject) => {

            if (this.state === 'running') {

                var savepath = path.join(__dirname, this.options.savepath, filename);

                if (fs.existsSync(savepath)) {
                    fs.unlinkSync(savepath);
                }

                const fln = (el) => el.includes('@filename');
                const i = this.options.seq.save.findIndex(fln);
                const seq = this.options.seq.save;
                seq[i] = seq[i].replace('@filename', savepath);

                this.command(seq).then((res) => {
                    resolve(res);
                });

            } else {
                this.kill().then(() => {
                    reject(new Error("save(): You must start a game before saving it"));
                });
            }

        });

    }


    // ---------------------------------------------
    // RESTORE
    // ---------------------------------------------
    this.restore = async function(filename) {

        return new Promise((resolve, reject) => {

            if (this.state === 'running') {

                var restpath = path.join(__dirname, this.options.savepath, filename);

                if (!fs.existsSync(restpath)) {
                    this.kill().then(() => {
                        reject(new Error("restore(): The game cannot be restored, the file doesn't exist"));
                    });
                }

                const fln = (el) => el.includes('@filename');
                const i = this.options.seq.restore.findIndex(fln);
                const seq = this.options.seq.restore;
                seq[i] = seq[i].replace('@filename', restpath);

                this.command(seq).then((res) => {
                    resolve(res);
                });

            } else {
                this.kill().then(() => {
                    reject(new Error("restore(): You must start a frotzer before restoring a previous game"));
                });
            }

        });

    }



    this._send = async function(text) {

        return new Promise((resolve, reject) => {

            if (this.state === 'running') {

                this.dfrotz.stdin.write(text);
                resolve();

            } else {
                reject(new Error("send(): frotzer cannot receive data. You must start a game first"));
            }

        });

    }



    this._setOptions = function(options) {

        // try to assign and update state
        // does nothing if no input
        // returns true if transition is possible

        // not possible to touch options while running
        if (this.state === 'running') {
            return false;
        }

        // do not change options if no input and options are already valid
        if (typeof options === 'undefined' && this.state === 'ready') {
            return true;
        }

        if (typeof options === 'undefined') {
            options = {};
            options.seq = {};
        }
	
        // apply defaults where opts are 'null' or 'undefined'
        this.options = {};
        this.options.dfexec = options.dfexec || './frotz/dfrotz';
        this.options.dfopts = options.dfopts || ['-m'];
        this.options.gamefile = options.gamefile || null;
        this.options.savepath = options.savepath || './saves';
        this.options.filter = options.filter || 'compact';

        this.options.seq = {};
        this.options.seq.quit = (options.seq ? options.seq.quit : undefined) || ['quit', 'yes'];
        this.options.seq.quit_endmarker = (options.seq ? options.seq.quit_endmarker : undefined) || ['<END>'];
        this.options.seq.save = (options.seq ? options.seq.save : undefined) || ['save', '@filename'];
        this.options.seq.restore = (options.seq ? options.seq.restore : undefined) || ['restore', '@filename'];
        this.options.seq.start = (options.seq ? options.seq.start : undefined) || [''];
        this.options.seq.start_drop = (options.seq ? options.seq.start_drop : undefined) || 2; // initial lines to drop at start

        // opts not mandatory to get ready to run frotzer (in options and options.seq)
        var dontcare = ['dfopts', 'filter', 'start'];

        // check if frotzer can run
        var chk2run = _.every(_.omit(this.options, dontcare), function(opt) {
            return (!_.isNull(opt) && !_.isUndefined(opt))
        }) && _.every(_.omit(this.options.seq, dontcare), function(opt) {
            return (!_.isNull(opt) || !_.isUndefined(opt))
        });
        this.state = chk2run ? 'ready' : 'idle';

        return true;
    }


} // end frotzer module




frotzer.prototype._filters = {};

frotzer.prototype._filters.compact = function(str) {
    return str
        .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
        .replace(/(\w)(\n)(\w)/g, '$1 $3') // Remove single \n inside paragraph
        .replace(/\n{2,}/g, '\n') // Reduce multiple \n\r to one
        .replace(/\s\w*>$/g, ''); // Remove cursor at the end of the line
};

frotzer.prototype._filters.oneline = function(str) {
    return str
        .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
        .replace(/\n{1,}/g, ' ') // No \n\r, spaces..
        .replace(/\s\w*>$/g, ''); // Remove cursor at the end of the line
};

frotzer.prototype._filters.none = function(str) {
    return str
};



exports.frotzer = frotzer;
