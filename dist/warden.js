((function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports);   } else {
    if(root.Warden == null){       Warden = {};
    }
    factory(Warden);
    if (typeof define === "function" && define.amd) {
      define(Warden);     } else {
      root.Warden = Warden;     }
  }
})(this, function(Warden){
  
  'use strict';
  Warden.version = "0.0.3-alpha"; 
  Warden.log = function(){
    console.log(arguments);
  }
  
/* Begin: src/modules/Helpers.js */
  /* Helpers functions */

  /*
    Function exists(@mixed x):
    Returns true is x exists and not equal null.
  */
  var exists = function(x){
    return typeof x !== 'undefined' && x !== null;
  }


  /*
    Function isArray(@mixed x):
    Checks is x param is real array or object (or arguments object)
  */
  var isArray = (function(){
    if(Array.isArray){
      return function(x){ 
        return Array.isArray(x); 
      }
    }else{
      return function(x){ 
        Object.prototype.toString.call(x) === '[object Array]';
      }
    }
  }());


  /*
    Function forWhilte(@array arr, @function fn, @mixed preventVal, @mixed preventRet):
    Applyies @fn to each element of arr while result of applying doesn't equal @preventVal
    Then returns @preventRet or false if @preventRet is not defined
  */
  var forWhile = function(arr, fn, preventVal, preventRet){
    for(var i=0, l=arr.length; i<l; i++){
      if(fn(arr[i], i) === preventVal){
        return preventRet && false; 
        break;
      }
    }
  };


  /* 
    Function forEach(@array arr, @function fn):
    Applies @fn for each item from array @arr usage: forEach([1,2], function(item){...})
  */
  var forEach = (function(){
    if(Array.prototype.forEach){
      return function(arr, fn){ 
        return arr ? arr.forEach(fn) : null;
      }
    }else{
      return function(arr, fn){ 
        for(var i=0, l=arr.length; i<l;i++){ 
          fn(arr[i], i);
        }
      }
    }
  }());


  /*
    Function filter(@array, @function)
    Filtering @array by @function and returns only mathcing as @function(item) === true  elements
    TODO: Should we keep it here?
  */
  var filter = (function(){
    if(Array.prototype.filter){
      return function(arr, fn){
        return arr ? arr.filter(fn) : null;
      }
    }else{
      return function(arr, fn){
        var filtered = [];
        for(var i=0, l=arr.length; i<l; i++){
          var res = fn(arr[i]);
          if(res === true){
            filtered.push(res);
          }
        }
        return filtered;
      }
    }
  })();/* End: src/modules/Helpers.js */
/* Begin: src/modules/Extend.js */
  /* 
    This methods extends @obj which can be both 
    function or object with Warden.js methods .emit(), 
    .listen() and .stream() 
  */

  Warden.extend = function(obj, conf) {
    /* Default configuration */

    var config = conf || {
      max : 256,       context : 'this',       emitter : null,       listener : null     };
    
    /* 
      Choose object to extend,
      if fn is constructor function, then that's prototype, else
      use actual object element 
    */
    
    var ctype = typeof obj,         inheritor = obj,         isConstructor = true;     
    switch(ctype){
      case 'function':         inheritor = obj.prototype;
        isConstructor = true;
      break;
      case 'object':         isConstructor = false;
      break;
    }
    
    /* 
      Setting up standart DOM event listener 
      and emitters  function to not overwrite them 
      and user should do not use that in config 
    */

    if(typeof jQuery !== 'undefined'){
      config.emitter = config.emitter || 'trigger';
      config.listener = config.listener || 'on';    
    }else
    if(typeof inheritor.addEventListener === 'function' || typeof inheritor.attachEvent === 'function'){
      config.listener = config.listener || (typeof inheritor.addEventListener === 'function' ? "addEventListener" : "attachEvent");
    }
      
    /* Collections of private handlers */
    /* Developed to incapsulate handlers of every object */
    var handlers = [];

    /* Setting new handler @fn of event type @type to @object */
    handlers.setNewHandler = function(object, type, fn){
      var handlers = this.getHandlers(object, type);
      if(handlers){
        if(handlers.length < config.max){
          handlers = handlers.push(fn);
        }else{
          throw "Maximal handlers count";
        }
      }else{
        var collection = this.getCollection(object);
        if(collection){
          collection.handlers[type] = collection.handlers[type] || [];
          collection.handlers[type].push(fn);
        }else{ 
          collection = {};
          collection.object = object;
          collection.handlers = {};
          collection.handlers[type] = [fn];
          this.push(collection);
        }
      }
    };
    
    /* Get collections of handlers by types of @object */
    handlers.getCollection = function(object){
      for(var i=this.length-1; i>=0; i--){
        if(this[i].object === object){
          return this[i]
        }
      }
      return false;
    };

    /* Get handlers of @object by @type */
    handlers.getHandlers = function(object, type){
      for(var i=this.length-1; i>=0; i--){
        if(this[i].object === object){
          return this[i].handlers[type];
        }
      }
      return false;
    };  
    
    /* Emitter method */
    inheritor.emit = function(ev){
      var self = this,
          callbacks = handlers.getHandlers(this, ev.type);
        
      forEach(callbacks, function(callback){
        callback.call(self, ev);
      });
        
      return this;
    };

    /* Listener function */
    inheritor.listen = function(type, callback, settings){    
      handlers.setNewHandler(this, type, callback);    
      if(this[config.listener]){
        this[config.listener].apply(this, [ev, function(event){ self.emit(event)}]);
      }
      return this;
    };
      
    /* Creates stream */
    inheritor.stream = function(type, cnt) {
      var stream = Warden.makeStream(type, cnt || this);

      handlers.setNewHandler(this, type, function(event){
        stream.eval(event);
      });

      if(this[config.listener]){
        this[config.listener].apply(this, [type, function(event){ stream.eval(event);}]);
      }
      
      return stream.get();
    };

    return obj;
  };/* End: src/modules/Extend.js */
/* Begin: src/modules/Processor.js */
  /*
    Processor module:
    In all processing functions: this variable is EventBus object;
  */

  function Processor(proc, host){
    var processes = proc || [], 
        locked = 0, 
        i = 0,
        self = this;
    
    this.getProcesses = function(){
      return processes;
    };

    var fns = [
      function $continue(data, context){
         return self.tick(data);
      },
      function $break(preventValue){
        return self.tick({}, 1);       },
      function $lock(){
        return locked = 1;
      },
      function $unlock(){
        return locked = 0;
      },
      function $host(){
        return self.hoster;
      }];
    

    this.hoster = host;

    this.start = function(event, context, fin){
      self.ctx = context;
      self.fin = fin;    
      
      if(locked){
        i = 0;
      }
      
      if(i==processes.length){
        i = 0;
        return fin(event);
      } 

      forEach(fns, function(x){
        self.ctx[x.name] = x;
      });

      this.tick(event);
    }

    this.tick = function(event, br, async){        
      if(br){
        i = 0;
        return void 0;
      }
      
      if(i==processes.length){
        forEach(fns, function(x){
          delete self.ctx[x.name]
        });
        i = 0;
        return self.fin(event);
      }
      i++
      processes[i-1].apply(self.ctx, [event]);
    };  
  }/* End: src/modules/Processor.js */
/* Begin: src/modules/Streams.js */
  /*
    Creates stream of data.
    If @x is string, that it interprets as datatype
    else if @x is function, than x's first arg is emitting data function
  */

  Warden.makeStream = function(x, context){
    var stream, ctype = typeof x;
    
    if(ctype == 'string'){
      stream = new Stream(x, context);
    }else
    if(ctype == 'function'){
        for(var i = 0, type = ""; i<2; i++){
          type += (Math.random() * 100000 >> 0) + "-";
        }

        stream = new Stream(type.slice(0,-1), context);
        x(function(expectedData){
          stream.eval(expectedData);
        });  
    }else{
      throw "Unexpected data type at stream\n";      
    }
    
    return stream;
  }

  function Stream(dataType, context, toolkit){
    var drive = [],
        bus = new DataBus();
    
    bus.host(this);

    this.eval = function(data){
      drive.forEach(function(bus){
        bus.fire(data, context);
      });
    };

    this.push = function(bus){
      drive.push(bus);
    };
    
    this.pop = function(bus){
      forEach(drive, function(b){
        if(bus == b){
          debugger;
        }
      });
    };

    this.get = function(){
      return bus;
    };

    return this;
  }/* End: src/modules/Streams.js */
/* Begin: src/modules/DataBus.js */
  function DataBus(proc){
    var processor = new Processor(proc || [], this),
        host = 0;
    
    this._ = {
      history : [],
      takes : [],
      fired : 0,
      taken : 0,
      skipped : 0
    };

    this.host = function(h){
      return host = h || host;
    }
    
    this.getProcessor = function(){
      return processor;
    }

    this.addProcess = function(process){
      var nprocess = [];
      forEach(processor.getProcesses(), function(i){
        nprocess.push(i);
      });
      nprocess.push(process);
      var nbus = new DataBus(nprocess);
      nbus.host(this.host());
      return nbus;
    }
      
    this.fire = function(data, context){  
      var self = this;
      this._.fired++;
      this._.history.push(data);
      processor.start(data, context, function(result){
        self._.taken++;
        self.handler.apply(context, [result]);
      });
    }
  }

  DataBus.prototype.listen = function(x){
    var nb = this.clone();
    if(typeof x === 'function'){
      nb.handler = x;
    } else {
      nb.handler = function(){
        console.log(x);
      }
    }
    
    this.host().push(nb);
    return nb;
  };

  DataBus.prototype.unbind = function(){
    this.host().pop(this);
  };

  DataBus.prototype.log = function(){
    return this.listen(function(data){
      console.log(data);
    });
  }

  DataBus.prototype.clone = function() {
    var nbus = new DataBus(this.getProcessor().getProcesses());
    nbus.host(this.host());
    return nbus;
  }

  DataBus.prototype.filter = function(x) {
    if(typeof x!== 'function'){
      throw "TypeError: filter argument mus be a function";
    }
    return this.addProcess(function(e){
      return x(e) === true ? this.$continue(e) : this.$break();
    });
  }

  DataBus.prototype.map = function(x) {
    var fn, ctype = typeof x, res;
    switch(ctype){
      case 'function':
        fn = function(e){
          return this.$continue(x.apply(this, [e]));
        }
      break;
      case 'string':
        fn = function(e){
          var t = e[x], 
              r = exists(t) ? t : x;
          this.$host()._.history[this.$host()._.fired-1] = r;
          return this.$continue(r);
        }
      break;
      case 'object':
        if(isArray(x)){
          fn = function(e){
            var res = [];
            forEach(x, function(i){
              var t = e[i];
              res.push(exists(t) ? t : i);
            }); 
            return this.$continue(res);
          }
        }else{
          fn = function(e){
            var res = {}, t;
            for(var prop in x){
              t = e[x[prop]];
              res[prop] = exists(t) ? t : x[prop];
            }
            return this.$continue(prop);
          }
        }
      break;
      default:
        fn = function(e){
          return this.$continue(x);
        }
      break;
    }
    return this.addProcess(fn);
  };

  DataBus.prototype.take = function(x){
    var ctype = typeof x;
    if(ctype == 'function'){
      return this.filter(x);
    }else
    if(ctype == 'number'){
      return this.addProcess(function(e){
        var bus = this.$host();
        bus._.limit = bus._.limit || x;
        if(bus._.taken === bus._.limit){
          return this.$break();
        }else{
          return this.$continue(e);
        }
      });
    }else{
      throw "TypeError: take argument must be function or number"
    }
  };

  DataBus.prototype.skip = function(c) {
    if(typeof c === 'number'){
      return this.addProcess(function(e){
        var bus = this.$host();
        if(bus._.fired <= c){
          this.$break();
        }else{
          return this.$continue(e);
        }
      });
    }else{
      throw "TypeError: skip argument must be only number";
    }
  };

  DataBus.prototype.mask = function(s){
    if(typeof s !== 'string'){
      return this.map(s);
    }else{
      return this.addProcess(function(event){
        var regex = /{{\s*[\w\.]+\s*}}/g;
        return this.$continue(s.replace(regex, function(i){return event[i.slice(2,-2)]}));
      })
    }
  };

  DataBus.prototype.debounce = function(t) {
    if(typeof t == 'number'){
      return this.addProcess(function(e){
        var self = this, bus = this.$host();
        clearTimeout(bus._.dbtimer);
        bus._.dbtimer = setTimeout(function(){
          delete bus._.dbtimer;
          self.$unlock();
          self.$continue(e);
        }, t);      
        this.$lock();
      });
    }else{
      throw "TypeError: argument of debounce must be a number of ms.";
    }
  };

  DataBus.prototype.getCollected = function(t){
    if(typeof t == 'number'){
      return this.addProcess(function(e){
        var self = this, bus = this.$host();
        if(!bus._.timer){
          bus._.collectionStart = bus._.fired-1;
          bus._.timer = setTimeout(function(){
            var collection = bus._.history.slice(bus._.collectionStart, bus._.fired);
            delete bus._.timer;
            self.$unlock();
            self.$continue(collection);
          }, t);
          this.$lock();
        }
      })
    }else{
      throw "TypeError: getCollected of debounce must be a number of ms.";
    }
  };

  DataBus.prototype.merge = function(bus){
    var self = this;
    return Warden.makeStream(function(emit){
      bus.listen(emit);
      self.listen(emit)
    }).get();
  };/* End: src/modules/DataBus.js */
/* Begin: src/modules/Pkg.js */
  Warden.pkg = function(object, method){

  };/* End: src/modules/Pkg.js */
}));