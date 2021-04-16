/* beautify preserve:start */
const path = require('path');
const {spawn} = require('child_process');
const _ = require('underscore');
/* beautify preserve:end */


function nfrotz(options) {


    var state = 'idle';

    this.options = validatedOpts(options);
    this.dfrotz;



    this.init = function(options) {

        return new Promise((resolve, reject) => {
            if (state !== 'started') {
                this.options = options ? validatedOpts(options) : this.options;
                resolve();

            } else {
                reject(new Error("A game is already running in nfrotz. You must quit before re-initializing it."));
            }
        });
    }




    this.start = function(options) {

        return new Promise((resolve, reject) => {

            this.options = options ? validatedOpts(options) : this.options;

            if (state === 'ready') {

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
                reject(new Error("nfrotz cannot start. You must provide a game file in the options"));
            }

        });

    }


    this.command = function(...commands) {

        return new Promise((resolve, reject) => {

            if (state === 'running') {

                var responses = [];


		var listener = () => {

                    let chunk;
                    let chunks = '';

                    while (null != (chunk = this.dfrotz.stdout.read())) {
                        chunks = chunks + chunk.toString();
                    }

                    responses.push(this._filters[this.options.filter](chunks));

                    if (responses.length == commands.length) {
                        this.dfrotz.stdout.removeListener('readable', listener);

                        if (responses.length == 1) {
                            resolve(responses[0]);
                        } else {
                            resolve(responses);
                        }

                    }

                }



		this.dfrotz.stdout.on('readable', listener);

                commands.forEach((command, index) => {
                    this.dfrotz.stdin.write(command + '\n');
                });


            } else {

                reject(new Error("nfrotz has to be started before receiving commands"));

            }


        });


        function objectifyResp(commands, responses) {

            var arr = [];

            commands.forEach((command, index) => {
                let obj = {
                    'index': index,
                    'command': command,
                    'response': response[index]
                }
                arr.push(obj);
            });

            return arr

        }

    }


    function validatedOpts(options) {
        options = options || {};
        options.dfexec = options.dfexec || './frotz/dfrotz';
        options.dfopts = options.dfopts || ['-m'];
        options.gamefile = options.gamefile || null;
        options.savepath = options.savepath || './saves';
        options.filter = options.filter || 'compact';
	
	
        state = _.every(_.omit(options, ['dfopts', 'filter']), function(opt) {
            return !_.isNull(opt)
        }) ? 'ready' : 'idle';

        return options;
    }

}


nfrotz.prototype._filters = {};
nfrotz.prototype._filters.compact = function(str) {
    return str
        .replace(/(^\s+)|(\s+$)/g, '')     // trailing spaces \NW\CR
        .replace(/(\w)(\n)(\w)/g, '$1 $3') // delete single \NW\CR inside paragraph
        .replace(/\n{2,}/g, '\n')          // reduce multiple \NW\CR to one
        .replace(/\s\w*>$/g, '');          // remove trailing cursor at the end
};
nfrotz.prototype._filters.none = function(str) {
    return str
};












var nf = new nfrotz();

var opts = {
    gamefile: '../Ruins/Ruins.z5',
    filter: 'compact'
};


(async () => {


    await nf.init(opts);

    var res = await nf.start();
    //console.log(res);

    var cres = await nf.command('', "look", "look ground", "take mushroom", "quit", "yes");
    console.log(JSON.stringify(cres, null, '\t'));


})().catch(e => {
    console.error(e)
});



/*

nfrotz.state = 'idle';


let nf = new nfrotz([options]);

nf.init(options);
ret promise

nf.start((output, error) => {
    ...
}) ret promise

nf.command("..", (output, error) => {
    ...
}) ret promise

nf.quit() ret promise

nf.save("...", (output, error) => {
    ...
}) ret promise

nf.restore("...", (output, error) => {
    ...
}) ret promise
*/
