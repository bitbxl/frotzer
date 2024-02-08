
## Frotzer
![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/52ed6d2926c3abdf270778e4bf1ddeeb/raw/frotzer-test.json) ![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/554394d67973a35b66f7b60a24fa0950/raw/frotzer-build.json) ![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/2133ec985f87c826f4a8c6cbcf550462/raw/frotzer-coverage.json) ![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/677c357466d848a20375d156b667d2c0/raw/frotzer-dfver.json)

This is a minimal but yet complete javascript wrapper of dumb frotz (dfrotz)
 running on Node.js. Frotzer is packaged as a module exposing its [API](docs/api.md) via a single
 class. When the installation is launched, the latest dfrotz C code is automatically downloaded from the Frotz [official repository](https://gitlab.com/DavidGriffith/frotz) and compiled at installation time in the module directory.

 Frotzer's main use is the creation of bots or testing enviroments
 for [Inform6](https://www.inform-fiction.org/)/[Inform7](http://inform7.com/) games and the development of their web frontends.


## Getting Started

### Dependencies

* GNU Linux (e.g. Ubuntu, etc.) or MacOS (note: **no Windows**)
* Underscore.js (installed automatically by npm)
* dfrotz (code automatically built at installation time from the official git repository)

### Installation
To use Frotzer in your Node.js project, run:
```javascript
npm i @bitbxl/frotzer
```

### Usage

Frotzer's behaviour is driven by a set of options that can be passed via the constructor. A typical (short) workflow with the Inform6 demo adventure (Ruins)
using default options:
```javascript
const {Frotzer} = require('@bitbxl/frotzer');

let frotzer = new Frotzer({storyfile: 'Ruins.z5'});

(async () => {

  let responses = await frotzer.start();
  // responses contains:
  // ['[Please press SPACE to begin.]', 'Days of searching, days of thirsty
  // hacking through the briars of the forest, but at last your patience was
  // rewarded. A discovery! (etc...)']

  let responses = await frotzer.command(['look', 'inventory', 'pick mushroom']);
  // responses contains:
  // [Or so your notes call this low escarpment of limestone, but the rainforest has
  // claimed it back. Dark olive trees crowd in on all sides, the air steams with the
  // mist of a warm recent rain, midges hang in the air. (etc...),
  // 'You're carrying: Waldeck's Mayan dictionary a sodium lamp a sketch-map of
  // Quintana Roo', 'You pick the mushroom, neatly cleaving its thin stalk.]

  let responses = await frotzer.save('myGame.qzl');
  // responses contains:
  // ['Please enter a filename [Ruins.qzl]:', 'Done']


  let responses = await frotzer.quit();
  // responses contains:
  // ['Are you sure you want to quit?', '<END>']

})()
```
More information on how to use Frotzer is in the [API Documentation](docs/api.md).
