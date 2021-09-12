/* beautify preserve:start */
const {frotzer} = require('./frotzer');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
var assert = chai.assert;
var expect = chai.expect;

const _ = require('underscore');
var fs = require('fs');
const path = require('path');
/* beautify preserve:end */



describe('frotzer', function() {

    var fr;

    var filepath;

        var opts = {
            gamefile: './Ruins.z5',
            filter: 'oneline'
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


        it('should start frotzer (with input options)', async () => {

            await fr.start(opts);
            var msg = await fr.command('');
            await fr.quit();

            return assert.isString(msg);

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

            var wf = () => {
                return new Promise(
                    resolve => fs.writeFile(filepath+'1', 'a', () => {
                        resolve();
                    })
                )
            }

            await wf;
            await fr.init(opts);
            await fr.start();
            await fr.command('look');
            await fr.command('take mushroom');
            await fr.save('ruins01.qzl');
            await fr.quit();

            return assert.isTrue(fs.existsSync(filepath))

        });


        it('should throw an error if frotzer is in not in running state', async () => {

            await fr.init(opts);

            return assert.isRejected(fr.save('ruins01.qzl'), Error);

        });
	

        after(function() {
            fs.unlinkSync(filepath);
        });


    });


});
