![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/554394d67973a35b66f7b60a24fa0950/raw/frotzer-test.json) ![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/554394d67973a35b66f7b60a24fa0950/raw/frotzer-build.json) ![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/bitbxl/554394d67973a35b66f7b60a24fa0950/raw/frotzer-coverage.json)

## Frotzer

This is a minimal but yet complete javascript wrapper of dumb frotz (dfrotz)
 running on Node.js. Frotzer is packaged as a module exposing its [API](docs/api.md) via a single
 class. The latest dfrotz C code is automatically downloaded from the Frotz [official repository](https://gitlab.com/DavidGriffith/frotz) and compiled at installation time in the module directory.

 Frotzer's main application would be the creation of bots and of testing enviroments
 helping for the development of games using [Inform6](https://www.inform-fiction.org/)/[Inform7](http://inform7.com/). Additional applications are web front-ends for Inform games.


## Getting Started

### Dependencies

* GNU Linux (e.g. Ubuntu, Fedora, etc.) or MacOS (**no Windows**)
* Underscore.js (installed automatically by npm)
* dfrotz (code automatically built at installation time from the included submodule)

### Installation
To use Frotzer in your project, run:
```javascript
npm install frotzer
```

### Usage

A typical (short) workflow using the demo adventure (Ruins):
```javascript
const {Frotzer} = require('frotzer');

let frotzer = new Frotzer({gamefile: 'Ruins.z5'});

(async () => {

  let responses = await frotzer.start();
  // ['[Please press SPACE to begin.]', 'Days of searching, days of thirsty
  // hacking through the briars of the forest, but at last your patience was
  // rewarded. A discovery! (etc...)']

  let responses = await frotzer.command(['look', 'pick mushroom', 'go east']);
  // ...

  await frotzer.save('myGame.qzl');
  await frotzer.quit();

}
```
More information on how to use Frotzer is in the [API Documentation](docs/api.md).


## Acknowledgments
To do..
