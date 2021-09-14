/* beautify preserve:start */
const {frotzer} = require('./frotzer');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
var assert = chai.assert;
var expect = chai.expect;

const _ = require('underscore');
var fs = require('fs').promises;
const path = require('path');
/* beautify preserve:end */



describe('frotzer', function() {

    var fr;

    var filepath;

    var opts = {
        gamefile: './Ruins.z5',
        //   filter: 'oneline'
    };


    describe('#init()', function() {

        beforeEach(function() {
            fr = new frotzer();
        });


        it('should set frotzer\'s default options', async () => {

            await fr.init()
            assert.isFalse(_.isEmpty(fr.options));

        });

        it('should set frotzer\'s options', async () => {

            await fr.init(opts);
            assert.isTrue(_.isMatch(fr.options, opts));

        });

        it('should throw an error if frotzer is in running state', async () => {

            await fr.start(opts);
            return assert.isRejected(fr.init(opts), Error);

        });
    });


    describe('#start()', function() {

        beforeEach(function() {
            fr = new frotzer();
        });


        it('should start frotzer', async () => {

            await fr.init(opts);
            await fr.start();
            var msg = await fr.command('look');
            await fr.quit();

            return assert.isString(msg);

        });


        it('should start frotzer (with minimum options)', async () => {

            await fr.start(opts);
            var msg = await fr.command('look');
            await fr.quit();

            return assert.isString(msg);

        });

        it('should start frotzer (with filter: oneline)', async () => {

            const op = Object.assign({}, opts);
            op.filter = 'oneline';

            await fr.start(op);
            var msg = await fr.command('look');
            await fr.quit();

	    //console.log(msg);
	    
            return assert.isFalse(msg.includes('\n'));

        });


        it('should start frotzer (with filter: none)', async () => {

            const op = Object.assign({}, opts);
            op.filter = 'none';

            await fr.start(op);
            var msg = await fr.command('look');
            await fr.quit();

            return assert.isTrue(msg.includes('\n\n'));

        });



        it('should throw an error if the input options are insufficient', async () => {

            const op = Object.assign({}, opts);
            delete op.gamefile;

            return assert.isRejected(fr.start(op), Error);

        });


        it('should throw an error if frotzer is in running state', async () => {

            await fr.start(opts);

            return assert.isRejected(fr.start(opts), Error);

        });

    });


    describe('#command()', function() {

        beforeEach(function() {
            fr = new frotzer();
        });


        it('should send a single command to frotzer', async () => {

            await fr.init(opts);
            await fr.start();
            var msg = await fr.command('look');

            await fr.quit();

            return assert.isString(msg);

        });

        it('should send multiple commands to frotzer', async () => {

            await fr.init(opts);
            await fr.start();
            var msg1 = await fr.command('look', 'inventory', 'pick up mushroom', 'inventory');
            var msg2 = await fr.command(['look', 'inventory', 'drop  mushroom', 'inventory']);

            await fr.quit();

            return (assert.isArray(msg1) && assert.isArray(msg2));

        });

        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.command('look'), Error);

        });

    });


    describe('#send()', function() {

        beforeEach(function() {
            fr = new frotzer();
        });


        it('should send a string to frotzer', async () => {

            await fr.init(opts);
            await fr.start();
            await fr.send('look' + '\n');
            await fr.quit();

        });

        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.send('look' + '\n'), Error);

        });

    });


    describe('#kill()', function() {

        beforeEach(function() {
            fr = new frotzer();
        });


        it('should kill frotzer', async () => {

            await fr.init(opts);
            await fr.start();
            await fr.command('look');
            await fr.kill();

            expect(fr.state).to.equal('ready');

        });

        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.kill(), Error);

        });

    });

    describe('#quit()', function() {

        beforeEach(function() {
            fr = new frotzer();
        });


        it('should quit frotzer', async () => {

            await fr.init(opts);
            await fr.start();
            await fr.command('look');
            await fr.quit();

        });

        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.quit(), Error);

        });



    });


    describe('#save()', function() {

        beforeEach(function() {
            fr = new frotzer();
            filepath = path.join(__dirname, './saves', 'ruins01.qzl');
        });



        it('should save a game', async () => {

            //  create a dummy savefile (to have frotzer overwriting it)
            try {
                await fs.access(filepath);
            } catch (error) {
                await fs.writeFile(filepath);
            }

            await fr.init(opts);
            await fr.start();
            await fr.command('look');
            await fr.command('take mushroom');
            await fr.save('ruins01.qzl');
            await fr.quit();


            var exist = true;
            try {
                await fs.access(filepath);
                await fs.unlink(filepath);
            } catch (error) {
                exist = false;
            }

            return assert.isTrue(exist)

        });


        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.save('ruins01.qzl'), Error);

        });


    });


    describe('#restore()', function() {

        beforeEach(function() {
            fr = new frotzer();
            filepath = path.join(__dirname, './saves', 'ruins01.qzl');
        });

        it('should restore a game', async () => {

            await fr.init(opts);
            await fr.start();
            await fr.command('look');
            await fr.command('take mushroom');
            await fr.save('ruins01.qzl');
            await fr.quit();

            fr = new frotzer();
            await fr.init(opts);
            await fr.start();
            await fr.restore('ruins01.qzl');
            var res = await fr.command('inventory');
            await fr.quit();

            await fs.unlink(filepath);

            return assert.isTrue(res.includes('mushroom'));

        });


        it('should throw an error if the file is not existing', async () => {

            await fr.init(opts);
            await fr.start();

            return assert.isRejected(fr.restore('ruins01.qzl'), Error);

        });


        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.restore('ruins01.qzl'), Error);

        });


    });



});
