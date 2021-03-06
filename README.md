Warden.js
=========

Small declarative library for event-driven development.

Warden.js provides a functionality for the development of event-driven applications without any dependencies. You can emit custom events with [`.emit()`](#emit) method and listen them with [`.listen()`](#listen) method, you can also listen native DOM events or extend EventEmitter class of Node. But the greatest is you can create and maintain streams of events with [`.stream()`](#stream). And more: you can create a custom data streams by [`Wardem.makeStream()`](#makeStream).

##Warden.extend##

<img src="https://raw.githubusercontent.com/zefirka/Warden.js/master/src/warden.png" align="right" width="301px" style='z-index: 32323; position: relative;'/>

There is no dependencies with DOM, jQuery events or another event emitting system in the Warden library. If you want to your object can emit, listen and creating streams of events you should use <code>Warden.extend</code> method.

[`Warden.extend(item, [config])`](https://github.com/zefirka/Warden.js/blob/master/docs/EmitterDocs.md)
```js
var Clicker = Warden.extend(function Clicker(btn){
	this.btn = btn;
});
```
or
```js
var module = Warden.extend({
  fire: function(){
    this.emit({
      type: "custom"
    });
  }
});
```
or even
```js
Warden.extend($)
var clicks = $('body').stream('click');
```
Now objects extended by `extend` method has methods `.listen`, `.emit` and `.stream`.

####Configuration####
You can configure next terms:
-  `max` - Count of maximal handlers per one event type. Default: 128
-  `emitter` - Name of native emitter function. For example $.trigger() for jQuery. Use it if your framework has already have event emitter method and you creating emittor from object that contains native emittor.
-  `listener` - Name of native listener function. For example $.on() for jQuery, or .addEventListener for native browser's DOM API
-  `context` - Value of `this` variable in handler. Emitted object by default.

###Methods###
####emit####
`.emit(event)`
Emitting custom event. Use object notation to describe event. Event argument required `type` property. For example:
```js
object.prototype.async = function(timeout){
	var self = this;
	setTimeout(function(){
		self.emit({
			type : "async",
			msg : "timeout is ended",
		});
	})	
};
```
####listen####
`.listen(type, callback, [config])`
Binding callback as a handler for events which type is `type`.
####stream####
`.stream(type, [config])`
Creates event stream and returns event Bus class object. 
##Streams##
Stream is representing Bus class object.