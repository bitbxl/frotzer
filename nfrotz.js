const path = require('path');
const {
    spawn
} = require('child_process');

const _ = require('underscore');


function nfrotz(options) {

    var state = 'idle';

    this.options = validatedOpts(options);
    this.dfrotz;

    
    this.init = function(options) {
        if (state !== 'started') {
            this.options = options ? validatedOpts(options) : this.options;
        } else {
            throw (new Error("A game is already running in nfrotz. You must quit before re-initializing it."));
        }
    }


    this.start = function(options) {

        this.options = options ? validatedOpts(options) : this.options;
	
        if (state === 'ready') {
	    
            const gf = this.options.gamefile ? path.join(__dirname, this.options.gamefile) : '';
	    var args = this.options.dfopts;
	    args.push(gf);
            this.dfrotz = spawn(path.join(__dirname, this.options.dfexec), args);

	    process.stdin.pipe(this.dfrotz.stdin);
	    
	    
            this.dfrotz.stdout.on('data', (data) => {
                console.log(`${data}`);
            });
	    
	    
            this.dfrotz.stderr.on('data', (data) => {
                console.error(`${data}`);
            });


            this.dfrotz.on('exit', (code) => {
                console.log(`Child process exited with code ${code}`);
            });


            this.dfrotz.on('error', (err) => {
                console.log(`Child process exited with error ${err}`);
            });


        } else {
            throw (new Error("nfrotz cannot start. You must provide a game file in the options"));
        }
    }





    function validatedOpts(options) {
        options = options || {};
        options.dfexec = options.dfexec || './frotz/dfrotz';
        options.dfopts = options.dfopts || [];
        options.gamefile = options.gamefile || null;
        options.savepath = options.savepath || './saves';
        options.filter = options.filter || null;

        state = _.every(_.omit(options, ['dfopts', 'filter', 'gamefile']), function(opt) {
            return !_.isNull(opt)
        }) ? 'ready' : 'idle';

        return options;
    }

}


var nf = new nfrotz();

console.log(nf.options);

nf.start({
    gamefile: '../Ruins/Ruins.z5'
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
