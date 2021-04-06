var path = require('path');
var _ = require('underscore');


function nfrotz(options) {

    var state = 'idle';

    this.options = validatedOpts(options);
    this.dfrotz;


    this.init = function(options) {
        if (state !== 'started') {
            this.options = validatedOpts(options);
        } else {
            throw (new Error("A game is already running in nfrotz. You must quit before re-initializing it."));
        }
    }

/*
    this.start = function(options) {
        if (state == 'ready') {

            this.dfrotz = childProcess.execFile(this.options.dfexec, dfrotzArgs, {
                encoding: 'utf8'
            }, (error, stdout, stderr) => {
                if (!stderr && !error) {
                    output = output.replace('\r', '').split('\n');

                    if (this.outputFilter) {
                        output = output.filter(this.outputFilter);
                        output[0] = DFrotzInterface.stripWhiteSpace(output[0], true);
                    }
                }

                cb({
                    stderr: stderr,
                    error: error
                }, {
                    pretty: output,
                    full: stdout
                });
            });







        } else {
            throw (new Error("nfrotz cannot start. You must provide a game file in the options"));
        }
    }

*/

    function validatedOpts(options) {
        options = options || {};
        options.dfexec = options.dfexec || './bin/dfrotz';
        options.gamefile = options.gamefile || null;
        options.savepath = options.savepath || './';
        options.filter = options.filter || null;

        state = options.gamefile ? 'ready' : 'idle';

        return options;
    }

}


var nf = new nfrotz();

(async function() {

    console.log(nf.options);

    nf.init({
        gamefile: 'a'
    });

    console.log(nf.options);

    
    console.log(path.join(__dirname, '/frotz/dfrotz'));
    
})();



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
