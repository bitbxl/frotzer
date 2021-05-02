const {
    nfrotz
} = require('./nfrotz');

var assert = require('assert');





describe('nfrotz', function() {

    var nf, opts;

    before(function() {

        nf = new nfrotz();

        opts = {
            gamefile: './Ruins.z5',
            filter: 'oneline'
        };
	
    });


    describe('#init()', function() {
        it('should set the nfrotz options', async function() {

	    await nf.init(opts);
	    
            assert.equal(nf.options.gamefile, opts.gamefile);
	    assert.equal(nf.options.filter, opts.filter);
	    //assert.equal(nf.state, 'ready');

        });



	
    });
});


/*

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

*/
