/* beautify preserve:start */
const {Frotzer} = require('../frotzer');

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;

var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const _ = require('underscore');
var fs = require('fs').promises;
const path = require('path');
/* beautify preserve:end */



describe('frotzer', function() {

  var frotzer;

  var filepath;

  var options = {
    storyfile: 'Ruins.z5',
    storydir: './test',
    savedir: './test',
    seq: {
      quit_endmarker: '<E>'
    }
  };

  // default options
  var defOptions = {
    dfexec: './frotz/dfrotz',
    dfopts: ['-m'],
    storyfile: null,
    storydir: './',
    savedir: './',
    filter: 'compact',
    seq: {
      quit: ['quit', 'yes'],
      quit_endmarker: '<END>',
      save: ['save', '@filename'],
      restore: ['restore', '@filename'],
      start: [''],
      start_drop: 1
    }
  };


  describe('#Frotzer()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });

    it('should set frotzer\'s default options', async () => {
      assert.isTrue(_.isEqual(frotzer.options, defOptions));
    });


    it('should set frotzer\'s options', async () => {
      await frotzer.init(options);
      var keys = (_.keys(options));
      assert.isTrue(_.isEqual(_.pick(_.omit(options, 'seq'), keys), _.pick(_.omit(frotzer.options, 'seq'), keys)));
      assert.isTrue(_.isEqual(_.pick(options.seq, keys), _.pick(frotzer.options.seq, keys)));
      assert.isTrue(_.isEqual(_.omit(defOptions, keys), _.omit(frotzer.options, keys)));
    });

    // Using kill() because quit() is not possible (game not started)
    afterEach(function() {
      frotzer.kill();
    });

  });



  describe('#init()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });


    it('should set frotzer\'s options', async () => {

      await frotzer.init(options);
      var keys = (_.keys(options));
      assert.isTrue(_.isEqual(_.pick(_.omit(options, 'seq'), keys), _.pick(_.omit(frotzer.options, 'seq'), keys)));
      assert.isTrue(_.isEqual(_.omit(defOptions, keys), _.omit(frotzer.options, keys)));

    });

    it('should throw an error if the passed options are not valid', async () => {

      const op = Object.assign({}, options);
      op.storyfile = new Array(['a', 'b']);

      //await frotzer.start(op);

      assert.isRejected(frotzer.init(op), Error);

    });

    it('should throw an error if frotzer is in running state', async () => {

      await frotzer.start(options);
      assert.isRejected(frotzer.init(options), Error);

    });

    // Using kill() because quit() is not possible (game not started)
    afterEach(function() {
      frotzer.kill();
    });

  });


  describe('#start()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });


    it('should start frotzer after initialization', async () => {

      await frotzer.init(options);
      await frotzer.start();

      var msg = await frotzer.command('look');
      await frotzer.quit();

      assert.isString(msg[0]);

    });


    it('should start frotzer (with minimum options)', async () => {

      await frotzer.start(options);

      var msg = await frotzer.command('look');
      await frotzer.quit();

      assert.isString(msg[0]);

    });

    it('should start frotzer (with filter: oneline)', async () => {

      const op = Object.assign({}, options);
      op.filter = 'oneline';

      await frotzer.start(op);
      var msg = await frotzer.command('look');
      await frotzer.quit();

      assert.isFalse(msg[0].includes('\n'));

    });


    it('should start frotzer (with filter: none)', async () => {

      const op = Object.assign({}, options);
      op.filter = 'none';

      await frotzer.start(op);
      var msg = await frotzer.command('look');
      await frotzer.quit();

      assert.isTrue(msg[0].includes('\n\n'));

    });


    it('should throw an error if the input options are insufficient', async () => {

      assert.isRejected(frotzer.start(_.omit(options, ['storyfile'])), Error);

    });


    it('should throw an error if frotzer is in running state', async () => {

      await frotzer.start(options);
      assert.isRejected(frotzer.start(options), Error);

    });

    // KIll dfrotz in last test
    after(function() {
      frotzer.kill();
    });


  });


  describe('#command()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });


    it('should send a single command to frotzer', async () => {

      await frotzer.init(options);
      await frotzer.start();
      var msg = await frotzer.command('look');

      await frotzer.quit();

      assert.isString(msg[0]);

    });

    it('should send multiple commands to frotzer', async () => {

      await frotzer.init(options);
      await frotzer.start();

      var msg = await frotzer.command('look', 'inventory', 'pick up mushroom', 'inventory');

      await frotzer.quit();

      assert.isArray(msg);

    });

    it('should throw an error if frotzer is in not in running state', async () => {

      assert.isRejected(frotzer.command('look'), Error);

    });


  });


  describe('#send()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });


    it('should send a string to frotzer', async () => {

      await frotzer.init(options);
      await frotzer.start();
      await frotzer.send('look' + '\n');
      await frotzer.send('pick up mushroom' + '\n');
      var res = await frotzer.command(['inventory']);

      await frotzer.quit();

      expect(res[0]).to.have.string('mushroom');

    });

    it('should throw an error if frotzer is in not in running state', async () => {

      assert.isRejected(frotzer.send('look' + '\n'), Error);

    });


  });


  describe('#kill()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });


    it('should kill frotzer', async () => {

      await frotzer.init(options);
      await frotzer.start();
      await frotzer.command('look');
      await frotzer.kill();

      expect(frotzer.state).to.equal('ready');
      expect(frotzer.dfrotz).to.equal(null);

    });

    it('should throw an error if frotzer is in not in running state', async () => {

      return assert.isRejected(frotzer.kill(), Error);

    });

  });


  describe('#quit()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
    });


    it('should quit frotzer', async () => {

      await frotzer.init(options);
      await frotzer.start();
      await frotzer.command('look');
      await frotzer.quit();

    });

    it('should throw an error if frotzer is in not in running state', async () => {

      return assert.isRejected(frotzer.quit(), Error);

    });

  });


  describe('#save()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
      filepath = path.join(__dirname, 'ruins01.qzl');
    });



    it('should save a game', async () => {

      //  create a dummy savefile (to have frotzer overwriting it)
      try {
        await fs.access(filepath);
      } catch (error) {
        await fs.writeFile(filepath, 'dummy');
      }

      await frotzer.init(options);
      await frotzer.start();
      await frotzer.command('look');
      await frotzer.command('take mushroom');
      await frotzer.save('ruins01.qzl');
      await frotzer.quit();


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

      return assert.isRejected(frotzer.save('ruins01.qzl'), Error);

    });


  });


  describe('#restore()', function() {

    beforeEach(function() {
      frotzer = new Frotzer();
      filepath = path.join(__dirname, 'ruins01.qzl');
    });

    it('should restore a game', async () => {

      await frotzer.init(options);
      await frotzer.start();
      await frotzer.command('look');
      await frotzer.command('take mushroom');
      await frotzer.save('ruins01.qzl');
      await frotzer.quit();

      frotzer = new Frotzer();
      await frotzer.init(options);
      await frotzer.start();
      await frotzer.restore('ruins01.qzl');
      var res = await frotzer.command('inventory');
      await frotzer.quit();

      await fs.unlink(filepath);

      return assert.isTrue(res[0].includes('mushroom'));

    });


    it('should throw an error if the file is not existing', async () => {

      await frotzer.start(options);

      return assert.isRejected(frotzer.restore('ruins01.qzl'), Error);

    });


    it('should throw an error if frotzer is in not in running state', async () => {

      return assert.isRejected(frotzer.restore('ruins01.qzl'), Error);

    });


  });



});
