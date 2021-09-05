/* beautify preserve:start */
const {frotzer} = require('./frotzer');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
var assert = chai.assert;
var expect = chai.expect;

const _ = require('underscore');
/* beautify preserve:end */



describe('frotzer', function() {

    var fr;
    var opts = {
        gamefile: './Ruins.z5',
        filter: 'oneline'
    };


    describe('#init()', function() {

        beforeEach(function() {
            fr = new frotzer();
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


});
