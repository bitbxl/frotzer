## Classes

<dl>
<dt><a href="#Frotzer">Frotzer</a></dt>
<dd><p>This class contains all the methods needed to create and control a
Frotzer instance (which wraps a dfrotz process).</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#frotzerOpts">frotzerOpts</a> : <code>Object</code></dt>
<dd><p>A data structure defining Frotzer&#39;s behaviour. Part of these options are
directly traceable to the ones passed to dfrotz via the CLI.</p>
</dd>
</dl>

<a name="Frotzer"></a>

## Frotzer
This class contains all the methods needed to create and control a
Frotzer instance (which wraps a dfrotz process).

**Kind**: global class  

* [Frotzer](#Frotzer)
    * [new Frotzer([options])](#new_Frotzer_new)
    * [.state](#Frotzer+state) : <code>String</code>
    * [.options](#Frotzer+options) : [<code>frotzerOpts</code>](#frotzerOpts)
    * [.dfrotz](#Frotzer+dfrotz) : [<code>ChildProcess</code>](https://nodejs.org/api/child_process.html#child_process_class_childprocess)
    * [.init([options])](#Frotzer+init)
    * [.start([options])](#Frotzer+start) ⇒ <code>Array.&lt;String&gt;</code>
    * [.command(...commands)](#Frotzer+command) ⇒ <code>Promise</code>
    * [.send([text])](#Frotzer+send)
    * [.save(filename)](#Frotzer+save) ⇒ <code>Promise</code>
    * [.restore(filename)](#Frotzer+restore) ⇒ <code>Promise</code>
    * [.quit()](#Frotzer+quit) ⇒ <code>Promise</code>
    * [.kill()](#Frotzer+kill)

<a name="new_Frotzer_new"></a>

### new Frotzer([options])
The constructor of the Frotzer instance. Frotzer is backed (i.e. wraps) by a
[Frotz](https://gitlab.com/DavidGriffith/frotz) (dfrotz) process controlled via a CLI. The
constructor optionally takes as input the [frotzerOpts](#frotzerOpts) structure to
initialize the module. For some of the options, defaults are used if the
value is not passed (refer to the [frotzerOpts](#frotzerOpts) documentation for a
list of the defaults). Some of them must be set in advance in order to be
able to start a game (e.g. the `gamefile`).

**Returns**: <code>Object</code> - The Frotzer instance.  

| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>frotzerOpts</code>](#frotzerOpts) | The options to use for the initialization of Frotzer. If they are not passed to the constructor then defaults are used. |

**Example**  
```js
const {Frotzer} = require('./frotzer');
let options = {gamefile: 'Ruins.z5'};

let frotzer = new Frotzer(options);
// Some of the options fields are set to default values

(async () => {
  let responses = await frotzer.start();
  // ['[Please press SPACE to begin.]', 'Days of searching, days of thirsty
  // hacking through the briars of the forest, but at last your patience was
  // rewarded. A discovery! (etc...)']
})();
```
<a name="Frotzer+state"></a>

### frotzer.state : <code>String</code>
The internal state of Frotzer which affects the ability to start a game.
The state, which mainly depends on the running state of the dfrotz
instance, can have the following values:
- `idle`: a game cannot be started yet due to missing or incomplete
options
- `ready`: a game is ready to be started.
- `running`: a game has been already started. It can be controlled by
sending commands through the interface.

**Kind**: instance property of [<code>Frotzer</code>](#Frotzer)  
**Default**: <code>&#x60;idle&#x60;</code>  
<a name="Frotzer+options"></a>

### frotzer.options : [<code>frotzerOpts</code>](#frotzerOpts)
The options currently set in Frotzer. See [frotzerOpts](#frotzerOpts) for the
details.

**Kind**: instance property of [<code>Frotzer</code>](#Frotzer)  
<a name="Frotzer+dfrotz"></a>

### frotzer.dfrotz : [<code>ChildProcess</code>](https://nodejs.org/api/child_process.html#child_process_class_childprocess)
The Node's child process in which dfrotz is running. It is `null` if a
game has not been started yet.

**Kind**: instance property of [<code>Frotzer</code>](#Frotzer)  
<a name="Frotzer+init"></a>

### frotzer.init([options])
This method is used to initialize Frotzer before starting a game (if not
done already at instantiation time using the constructor). Typically the
[frotzerOpts](#frotzerOpts) structure is passed to change the options currently
set in Frotzer. The passed values will _overwrite_ the existing ones.

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Throws**:

- <code>Error</code> if Frotzer is in `running` state.


| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>frotzerOpts</code>](#frotzerOpts) | The options to use for the initialization of Frotzer. They overwrite the existing ones. |

**Example**  
```js
// Frotzer has been instantiated with some options passed via the
// constructor
let options = {gamefile: 'Ruins.z5'}
//
await frotzer.init(options);
// Frotzer is ready to start
```
<a name="Frotzer+start"></a>

### frotzer.start([options]) ⇒ <code>Array.&lt;String&gt;</code>
This method is used to start Frotzer. When started, a dfrotz process is
created in the background. The process is controlled via in/out streams
to/from the dfrotz CLI. A [frotzerOps](frotzerOps) structure can be passed to
overwrite the existing ones. Note that these passed values will
_overwrite_ some of the currently set options.

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Returns**: <code>Array.&lt;String&gt;</code> - The response(s) of dfrotz after the start sequence
(either a single value or an array of values)  
**Throws**:

- <code>Error</code> if Frotzer is already in `running` state.
- <code>Error</code> if the passed [frotzerOpts](#frotzerOpts) are not valid or
incomplete.


| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>frotzerOpts</code>](#frotzerOpts) | The options to apply before starting Frotzer. They overwrite the existing ones. |

**Example**  
```js
// Frotzer has been partially initialized. But no gamefile has been
// provided yet.
let options = {gamefile: 'Ruins.z5'}
//
await frotzer.start(options);
// Frotzer starts Ruins...
```
<a name="Frotzer+command"></a>

### frotzer.command(...commands) ⇒ <code>Promise</code>
This method is used to send commands to the dfrotz background process.
The commands are streamed directly to the dfrotz CLI. This method
accepts one or more commands in the form of multiple input arguments and/or
arrays of commands. In case of a single command is passed, this method
returns the dfrotz response. If multiple commands are passed then an
array containing all the responses is returned.

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Returns**: <code>Promise</code> - The response(s) of dfrotz (either a single value or an
array of values)  
**Throws**:

- <code>Error</code> if Frotzer is not in `running` state.


| Param | Type | Description |
| --- | --- | --- |
| ...commands | <code>String</code> \| <code>Array.&lt;String&gt;</code> | The command(s) to be passed to dfrotz |

**Example**  
```js
// Frotzer is in running state.
//
// input as single argument - output as String
let response = await frotzer.command('pick up mushroom');
// returns "You pick up the green mushroom from the ground"
//
// input as multiple arguments - output as Array
let responses = await frotzer.command('drop bag', 'go east');
// returns ["You drop your bag on the floor", "You step into the great hall of the castle..."]
//
// input as Array - output as Array
let responses = await frotzer.command(['talk to Ada', 'hi!']);
// returns ["Ada turns her eyes to you and smiles", "Hey you!"]
//
// All the above apporaches can be mixed up
```
<a name="Frotzer+send"></a>

### frotzer.send([text])
This method is used to send _raw_ text to the dfrotz background process.
The text is streamed directly to the dfrotz CLI. `send()` can be useful
when the player is requested to interact with the game by using keyboard
keys. To send commands it is better use the [command](#Frotzer+command) method
which can process multiple of them at the same time.

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Throws**:

- <code>Error</code> if Frotzer is not in `running` state.


| Param | Type | Description |
| --- | --- | --- |
| [text] | [<code>frotzerOpts</code>](#frotzerOpts) | The raw text to pass to dfrotz. Note that an ending `\n` shall be included to have dfrotz processing the commands. |

**Example**  
```js
// dfrotz requests the player to use the arrow keys to control the game.
let upChar = String.fromCharCode(38); // arrow up
frotzer.send(upChar);
//
// Sending commands using send()
frotzer.send('go west\n');
```
<a name="Frotzer+save"></a>

### frotzer.save(filename) ⇒ <code>Promise</code>
This method is used to save the state of the game currently running in
Frotzer. `save()` executes the sequence of commands in dfrotz as specified
in the `seq.save` field of the [frotzerOpts](#frotzerOpts) structure, which can be
customized. `save()` takes as imput the name of the file in which the game
state has to be stored. The base directory to use can be specified in the
`savedir` field of the Frotzer options (see [frotzerOpts](#frotzerOpts)).

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Returns**: <code>Promise</code> - The response(s) of dfrotz (either a single value or an
array of values)  
**Throws**:

- <code>Error</code> if Frotzer is not in `running` state.


| Param | Type | Description |
| --- | --- | --- |
| filename | <code>String</code> | The name of the file in which the game state has to be stored. |

**Example**  
```js
// Frotzer is in running state. The default base dir in the options is
// '.saves'.
//
await frotzer.save('myGame.qzl');
// The game state is saved in the file `saves/myGame.qzl` located in
// the module root.
```
<a name="Frotzer+restore"></a>

### frotzer.restore(filename) ⇒ <code>Promise</code>
This method is used to restore the state of the game currently running in
Frotzer. `restore()` executes the sequence of commands in dfrotz as
specified in the `seq.restore` field of the [frotzerOpts](#frotzerOpts) structure,
which can be customized. `restore()` takes as imput the name of the file
from  which the game state has to be restored. The base direcotry to use
can be specified in the `savedir` field of the Frotzer options (see
[frotzerOpts](#frotzerOpts)).

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Returns**: <code>Promise</code> - The response(s) of dfrotz (either single value or an
array of values)  
**Throws**:

- <code>Error</code> if a file having the input filename is not existing.
- <code>Error</code> if Frotzer is not in `running` state.


| Param | Type | Description |
| --- | --- | --- |
| filename | <code>String</code> | The name of the file from which the game state has to be restored. |

**Example**  
```js
// Frotzer is in running state. The default base dir in the options is
// '.saves'.
//
await frotzer.restore('myGame.qzl');
// The game state is restored from the file `saves/myGame.qzl` located in
// the module root.
```
<a name="Frotzer+quit"></a>

### frotzer.quit() ⇒ <code>Promise</code>
This method is used to quit dfrotz and pass Frotzer to `ready` state.
`quit` executes a sequence of dfrotz commands as specified in the
`seq.quit` field of the [frotzerOpts](#frotzerOpts) structure, which can be
customized. The last string in the response(s) returned by `quit` is a
default value specified by `seq.quit_endmarker` in the Frotzer's options,
which can be also customized.

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Returns**: <code>Promise</code> - The response(s) of dfrotz after the quit sequence
followed by an end marker  
**Throws**:

- <code>Error</code> if Frotzer is not in `running` state.

**Example**  
```js
// Frotzer is in running state.
//
await frotzer.quit();
// returns ["Are you sure?", "<END>"]
```
<a name="Frotzer+kill"></a>

### frotzer.kill()
This method is used to kill the dfrotz process and pass Frotzer to `ready`
state. `kill()` is another way to terminate dfrotz. Differently from
[quit](#Frotzer+quit) the termination is commanded at OS level. The state
is moved to `ready` at the end of the execution.

**Kind**: instance method of [<code>Frotzer</code>](#Frotzer)  
**Throws**:

- <code>Error</code> if Frotzer is not in `running` state.

**Example**  
```js
// Frotzer is in running state.
//
await frotzer.kill();
// dfrotz process is killed, Frotzer's state is `ready`
```
<a name="frotzerOpts"></a>

## frotzerOpts : <code>Object</code>
A data structure defining Frotzer's behaviour. Part of these options are
directly traceable to the ones passed to dfrotz via the CLI.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| options.dfexec | <code>String</code> | The path of the executable used to launch  dfrotz. The base path is the module root. Default is `./frotz/dfrotz`. |
| options.dfopts | <code>String</code> | The options (array) to pass to dfrotz.  Default is `['-m']` (this switches off the MORE prompts). See [here](https://gitlab.com/DavidGriffith/frotz/-/raw/master/doc/dfrotz.6) for a list of the `dfrotz`'s options. |
| options.gamefile | <code>String</code> | The gamefile to load when starting dfrotz. Providing this option is obviousy required to be able to start a game. The base directory is the one specified in the `savedir` field of the options (module root as base path). |
| options.savedir | <code>String</code> | The base directory to use when storing and loading gamefiles. The base path is the module root. Default is `./ saves`. |
| options.filter | <code>String</code> | The filter to use to render the result of the commands returned by dfrotz. Available options are `oneline`(all compressed in one line, no prompt), `compact` (removes trailing spaces, minimizes the number of `\n\r`, no prompt) and `none` (no filter applied). Default is `compact`. |
| options.seq.quit | <code>Array.&lt;String&gt;</code> | The sequence of commands executed in dfrotz to quit the game. Default is `['quit', 'yes']`. |
| options.seq.quit_endmarker | <code>String</code> | The string to use as last response after the termination of the dfrotz process. Default is `<END>`. |
| options.seq.save | <code>Array.&lt;String&gt;</code> | The sequence of commands executed by dfrotz to save a game state. The value `@filename` in the sequence will be substituted by the filename passed to the [save](#Frotzer+save) method. Default is `['save', '@filename']`. |
| options.seq.restore | <code>Array.&lt;String&gt;</code> | The sequence of commands executed by dfrotz to restore a game state. The value `@filename` in the sequence will be substituted by the filename passed to the [restore](#Frotzer+restore) method. Default is `['restore', '@filename']`. |
| options.seq.start | <code>Array.&lt;String&gt;</code> | The sequence of commands executed just after starting dfrotz. Defaut is `''`(empty string) meaning that il will be sent just a `\n` (to skip automatically a first request to press a key). |
| options.seq.start_drop | <code>String</code> | The number of initial response lines to drop after a start. Default is `1` (this tipically removes from the response(s) the dfrotz launch command displayed on the shell). |

