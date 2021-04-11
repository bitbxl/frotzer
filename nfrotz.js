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

                console.log(gf);

                this.dfrotz = spawn(path.join(__dirname, this.options.dfexec), dfargs);

                this.dfrotz.stdout.once('readable', () => {
                    let chunk;
                    let chunks = '';

                    while (null != (chunk = this.dfrotz.stdout.read())) {
                        chunks = chunks + chunk.toString();
                    }
                    this.state = 'running';
                    resolve(chunks);
                });

            } else {
                reject(new Error("nfrotz cannot start. You must provide a game file in the options"));
            }

        });

    }


    this.command = function(command) {

        return new Promise((resolve, reject) => {

            if (state === 'running') {





            } else {

                reject(new Error("nfrotz has to be started before receiving commands"));

            }


        });
    }





    function validatedOpts(options) {
        options = options || {};
        options.dfexec = options.dfexec || './frotz/dfrotz';
        options.dfopts = options.dfopts || [];
        options.gamefile = options.gamefile || null;
        options.savepath = options.savepath || './saves';
        options.filter = options.filter || null;

        state = _.every(_.omit(options, ['dfopts', 'filter']), function(opt) {
            return !_.isNull(opt)
        }) ? 'ready' : 'idle';

        return options;
    }


}


var nf = new nfrotz();


var opts = {
    gamefile: '../Ruins.z5'
};


(async () => {

    await nf.init(opts);
    var res = await nf.start();
    console.log(res);

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
