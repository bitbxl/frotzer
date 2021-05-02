/* v0.1

/* beautify preserve:start */
var fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const _ = require('underscore');
/* beautify preserve:end */


function nfrotz(options) {


    var state = 'idle';

    this.options = _validatedOpts(options);
    this.dfrotz;


    
    this.init = async function(options) {

	
        return new Promise((resolve, reject) => {

            if (state !== 'running') {

                this.options = options ? _validatedOpts(options) : this.options;
                resolve();

            } else {
                reject(new Error("A game is already running in nfrotz. You must quit before re-initializing it."));
            }

        });

	
    }




    this.start = async function(options) {

        return new Promise((resolve, reject) => {

            if (state === 'ready') {

                this.options = options ? _validatedOpts(options) : this.options;

                var dfargs = this.options.dfopts;
                const gf = this.options.gamefile ? path.join(__dirname, this.options.gamefile) : null;
                if (gf)
                    dfargs.push(gf);


                this.dfrotz = spawn(path.join(__dirname, this.options.dfexec), dfargs);

                this.dfrotz.stdout.once('readable', () => {
                    let chunk;
                    let chunks = '';

                    while (null != (chunk = this.dfrotz.stdout.read())) {
                        chunks = chunks + chunk.toString();
                    }
                    state = 'running';
                    resolve(chunks);
                });


            } else {
                reject(new Error("start(): nfrotz cannot be started. You must provide a game file in the options"));
            }


        });

    }



    this.command = async function(...commands) {

        commands = _.flatten(commands);

        var _command = async (command) => {

            return new Promise((resolve, reject) => {
                var response;

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

                /*
                setTimeout(() => {
                this.dfrotz.stdin.removeListener('readable', listener);
                resolve('');
                }, 1000);
                */

            });
        }


        return new Promise((resolve, reject) => {

            if (state === 'running') {

                var responses = [];

                (async () => {

                    for (i = 0; i < commands.length; i++) {

                        let res = await _command(commands[i]);
                        responses.push(res);

                    }

                    if (responses.length == 1) {
                        resolve(responses[0]);
                    } else {
                        resolve(responses);
                    }

                })();

            } else {
                reject(new Error("command(): nfrotz cannot receive game commands. You must start a game first"));
            }

        });


    }



    this.send = function(text) {
        if (state === 'running') {

            this.dfrotz.stdin.write(text);

        } else {
            reject(new Error("send(): nfrotz cannot receive data. You must start a game first"));
        }
    }



    this.quit = async function() {

        return new Promise((resolve, reject) => {

            if (state === 'running') {

                (async () => {

                    let res = await this.command(this.options.seq.quit);
		    state = 'ready';
                    resolve(res);

                })();


            } else {
                reject(new Error("quit(): You must start a game before quitting it"));
            }

        });

    }


    
    this.save = async function(filename) {

        return new Promise((resolve, reject) => {

            if (state === 'running') {

                (async () => {

                    var savepath = path.join(__dirname, this.options.savepath, filename);
                    //console.log(savepath);

                    if (fs.existsSync(savepath)) {
                        fs.unlinkSync(savepath);
                    }

                    let res = await this.command(this.options.seq.save, savepath);

                    resolve(res);

                })();


            } else {
                reject(new Error("save(): You must start a game before saving it"));
            }

        });

    }

    

    this.restore = async function(filename) {

        return new Promise((resolve, reject) => {

            if (state === 'running') {

                (async () => {

                    var restpath = path.join(__dirname, this.options.savepath, filename);
                    console.log(restpath);

                    if (!fs.existsSync(restpath)) {
                        reject(new Error("The game cannot restored, the file doesn't exist"));
                    }

                    let res = await this.command('restore', restpath);

                    console.log('res to restore: ' + res);

                    resolve(res);

                })();


            } else {
                reject(new Error("restore(): You must start a game before restoring a previous one"));
            }

        });

    }




    function _validatedOpts(options) {
        options = options || {};
        options.dfexec = options.dfexec || './frotz/dfrotz';
        options.dfopts = options.dfopts || ['-m'];
        options.gamefile = options.gamefile || null;
        options.savepath = options.savepath || './saves';
        options.filter = options.filter || 'compact';

        options.seq = options.seq || {};
        options.seq.quit = options.seq.quit || ['quit', 'yes'];
        options.seq.save = options.seq.save || ['save'];
        options.seq.restore = options.seq.restore || ['restore'];
        options.seq.start = options.seq.start || null;


        state = _.every(_.omit(options, ['dfopts', 'filter']), function(opt) {
            return !_.isNull(opt)
        }) ? 'ready' : 'idle';

        return options;
    }


}



nfrotz.prototype._filters = {};
nfrotz.prototype._filters.compact = function(str) {
    return str
        .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
        .replace(/(\w)(\n)(\w)/g, '$1 $3') // Remove single \n inside paragraph
        .replace(/\n{2,}/g, '\n') // Reduce multiple \n\r to one
        .replace(/\s\w*>$/g, ''); // Remove cursor at the end
};
nfrotz.prototype._filters.oneline = function(str) {
    return str
        .replace(/(^\s+)|(\s+$)/g, '') // Remove trailing spaces and \n\r
        .replace(/\n{1,}/g, ' ') // No \n\r, spaces..
        .replace(/\s\w*>$/g, ''); // Remove cursor at the end
};
nfrotz.prototype._filters.none = function(str) {
    return str
};




var nf = new nfrotz();

var opts = {
    gamefile: './Ruins.z5',
    filter: 'oneline'
};

var res;

(async () => {

    await nf.init(opts);
    console.log('Game initiated');

    await nf.start();
    console.log('Game started');

    res = await nf.command('', "look", "look ground", "take mushroom");
    console.log(JSON.stringify(res, null, '\t'));

    res = await nf.save('pippo.qzl');
    console.log('Game saved:');
    console.log(res);

    res = await nf.quit();
    console.log('Game quit: ');
    console.log(res);

    await nf.start(opts);
    console.log('Game restarted');

    res = await nf.command('');
    console.log(JSON.stringify(res, null, '\t'));

    res = await nf.restore('pippo.qzl');
    console.log('Game restored: ');
    console.log(res);

    res = await nf.command("take mushroom");
    console.log(JSON.stringify(res, null, '\t'));

    res = await nf.quit();
    console.log('Game quit: ');
    console.log(res);


})().catch(e => {
    console.error(e)
});
