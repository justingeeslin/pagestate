(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const PageStateController = require('./js/PageStateController.js')
const Page = require('./js/Page.js')

},{"./js/Page.js":2,"./js/PageStateController.js":3}],2:[function(require,module,exports){
const extend = require('extend')
const Component = require('sensible-component')

var Page = function( options ) {
  var self = this;

  // Title of the page. Appears in history, bookmarks, and tabs
  var title = "";
  // Suffix like the name of the app, etc.
  var suffix = "";

  Object.defineProperty(this, 'title', {
    get: function() { return title; },
    set: function(newTitle) {
      title = newTitle;
      document.title = title + this.suffix;
      return true
    },
    enumerable: true
  });

  Object.defineProperty(this, 'suffix', {
    get: function() { return suffix; },
    set: function(newSuffix) {
      suffix = newSuffix;
      document.title = this.title + suffix;
      return true
    },
    enumerable: true
  });

  var defaults = {
    // A special character after which in the state should be some selector for an element to scroll to
    fragmentCharacter: "#",
    // The current fragment last scrolled to
    fragment: "",
    // Customizable post-load function
    postload: function() { }
  }

  self = extend(self, defaults);
  self = extend(self, options);

  self = extend(self, new Component(self));

  $(this.target).on('postload.page', this.postload);

  this.stateChange = function(oldState, newState) {
    self.log('New state: ' + newState)
    $(this.target).trigger('postload.' + self.eventNamespace);
  }

  // A algorithm for selecting elements using a string in the fragment. Select the p of type of a number. Select the id if not.
	var fragmentFind = function(fragment) {
		var selector, jumpTarget;
		if (Number.isInteger(parseInt(fragment) )) {
			self.log('Fragment is a number..')
			selector = 'p:eq(' + fragment + ')'
			jumpTarget = self.target.find(selector)
		}
		else {
			selector = '#' + fragment;
			jumpTarget = self.target.find(selector);
			// If wrapped in a glow-span, glow it, the parent, instead.
			var jumpTargetParent = jumpTarget.parent();
			if (jumpTargetParent.hasClass('glow-span')) {
				jumpTarget = jumpTargetParent;
			}
		}

    var isJumpTargetFound = jumpTarget.length > 0;
    var isTargetinDOM = typeof jumpTarget.offset !== "undefined";
    if (!isJumpTargetFound) {
      console.warn('Attempting to scroll to a element that does not exist. ', selector);
      return false;
    }
    if (!isTargetinDOM) {
      console.warn('Scrolling to a element that isnt in the DOM. Exiting..', jumpTarget);
      return false;
    }

		return jumpTarget;
	}

  // Process the fragment on the state
  $(this.target).on('postload.' + this.eventNamespace, function() {
    self.fragment = self.state.split(self.fragmentCharacter)[1]

    if (typeof self.fragment === "undefined" || self.fragment.length <= 0) {
      self.log('No fragment. Exiting.. State: ' + self.state)
      return;
    }

    var scrollTarget = fragmentFind(self.fragment);

    if (scrollTarget == false) {
			return;
		}

    var distanceToScroll = scrollTarget.offset().top;

    $('html, body').scrollTop(distanceToScroll);
  });

  $(this.target).trigger('postload.' + this.eventNamespace);

  return this;
}
module.exports = Page;

},{"extend":5,"sensible-component":6}],3:[function(require,module,exports){
const crossroads = require('crossroads');
const extend = require('extend');

var PageStateController = function( options ) {
  var self = this;

  var defaults = {
    target: 'body',
    state: '',
    routes: {},
    preprocessState: function(location) {
      return location;
    },
    // Define an event name for an event to trigger when this component goes.
    eventName: undefined,
    debug: false
  }

  self = extend(self, defaults)
  self = extend(self, options)

  this.log = function(msg) {
		if (self.debug) {
			console.log(msg);
		}
	}

  this.targetEl = $(this.target);

  // Cast "undefined" strings as literal undefined
  crossroads.shouldTypecast = true
  // Allow the same route to run twice
  crossroads.ignoreState = true

  // Add the routes to crossroads.
  for(var r in this.routes) {
    this.log('Added route for: ', r);
    crossroads.addRoute(r, this.routes[r]);
  }

  this.go = function() {;
    var oldState = self.state;
    self.state = self.preprocessState(window.location.pathname + window.location.hash);
    var newState = self.state;

    if (self.state == '') {
      self.log('Page State Controller going with an empty state. Exiting..');
      return;
    }

    // Perform Routes Actions.
    self.log('Parsing Route: ' + self.state)
    crossroads.parse(self.state);


    if (typeof self.eventName !== "undefined") {
      $(document.body).trigger(self.eventName, [oldState, newState] );
    }
  }

  $(window).on('popstate', function() {
    self.log('Pop State fired!');
    self.go();
  });

  if (document.readyState === 'complete') {
    self.log('Document ready.');
    self.go();
  }
  else {
    $(document).ready(function() {
      self.log('Document ready.');
      self.go();
    });
  }

  return this;
}

module.exports = PageStateController;

},{"crossroads":4,"extend":5}],4:[function(require,module,exports){
/** @license
 * crossroads <http://millermedeiros.github.com/crossroads.js/>
 * Author: Miller Medeiros | MIT License
 * v0.12.2 (2015/07/31 18:37)
 */

(function () {
var factory = function (signals) {

    var crossroads,
        _hasOptionalGroupBug,
        UNDEF;

    // Helpers -----------
    //====================

    // IE 7-8 capture optional groups as empty strings while other browsers
    // capture as `undefined`
    _hasOptionalGroupBug = (/t(.+)?/).exec('t')[1] === '';

    function arrayIndexOf(arr, val) {
        if (arr.indexOf) {
            return arr.indexOf(val);
        } else {
            //Array.indexOf doesn't work on IE 6-7
            var n = arr.length;
            while (n--) {
                if (arr[n] === val) {
                    return n;
                }
            }
            return -1;
        }
    }

    function arrayRemove(arr, item) {
        var i = arrayIndexOf(arr, item);
        if (i !== -1) {
            arr.splice(i, 1);
        }
    }

    function isKind(val, kind) {
        return '[object '+ kind +']' === Object.prototype.toString.call(val);
    }

    function isRegExp(val) {
        return isKind(val, 'RegExp');
    }

    function isArray(val) {
        return isKind(val, 'Array');
    }

    function isFunction(val) {
        return typeof val === 'function';
    }

    //borrowed from AMD-utils
    function typecastValue(val) {
        var r;
        if (val === null || val === 'null') {
            r = null;
        } else if (val === 'true') {
            r = true;
        } else if (val === 'false') {
            r = false;
        } else if (val === UNDEF || val === 'undefined') {
            r = UNDEF;
        } else if (val === '' || isNaN(val)) {
            //isNaN('') returns false
            r = val;
        } else {
            //parseFloat(null || '') returns NaN
            r = parseFloat(val);
        }
        return r;
    }

    function typecastArrayValues(values) {
        var n = values.length,
            result = [];
        while (n--) {
            result[n] = typecastValue(values[n]);
        }
        return result;
    }

    // borrowed from MOUT
    function decodeQueryString(queryStr, shouldTypecast) {
        var queryArr = (queryStr || '').replace('?', '').split('&'),
            reg = /([^=]+)=(.+)/,
            i = -1,
            obj = {},
            equalIndex, cur, pValue, pName;

        while ((cur = queryArr[++i])) {
            equalIndex = cur.indexOf('=');
            pName = cur.substring(0, equalIndex);
            pValue = decodeURIComponent(cur.substring(equalIndex + 1));
            if (shouldTypecast !== false) {
                pValue = typecastValue(pValue);
            }
            if (pName in obj){
                if(isArray(obj[pName])){
                    obj[pName].push(pValue);
                } else {
                    obj[pName] = [obj[pName], pValue];
                }
            } else {
                obj[pName] = pValue;
           }
        }
        return obj;
    }


    // Crossroads --------
    //====================

    /**
     * @constructor
     */
    function Crossroads() {
        this.bypassed = new signals.Signal();
        this.routed = new signals.Signal();
        this._routes = [];
        this._prevRoutes = [];
        this._piped = [];
        this.resetState();
    }

    Crossroads.prototype = {

        greedy : false,

        greedyEnabled : true,

        ignoreCase : true,

        ignoreState : false,

        shouldTypecast : false,

        normalizeFn : null,

        resetState : function(){
            this._prevRoutes.length = 0;
            this._prevMatchedRequest = null;
            this._prevBypassedRequest = null;
        },

        create : function () {
            return new Crossroads();
        },

        addRoute : function (pattern, callback, priority) {
            var route = new Route(pattern, callback, priority, this);
            this._sortedInsert(route);
            return route;
        },

        removeRoute : function (route) {
            arrayRemove(this._routes, route);
            route._destroy();
        },

        removeAllRoutes : function () {
            var n = this.getNumRoutes();
            while (n--) {
                this._routes[n]._destroy();
            }
            this._routes.length = 0;
        },

        parse : function (request, defaultArgs) {
            request = request || '';
            defaultArgs = defaultArgs || [];

            // should only care about different requests if ignoreState isn't true
            if ( !this.ignoreState &&
                (request === this._prevMatchedRequest ||
                 request === this._prevBypassedRequest) ) {
                return;
            }

            var routes = this._getMatchedRoutes(request),
                i = 0,
                n = routes.length,
                cur;

            if (n) {
                this._prevMatchedRequest = request;

                this._notifyPrevRoutes(routes, request);
                this._prevRoutes = routes;
                //should be incremental loop, execute routes in order
                while (i < n) {
                    cur = routes[i];
                    cur.route.matched.dispatch.apply(cur.route.matched, defaultArgs.concat(cur.params));
                    cur.isFirst = !i;
                    this.routed.dispatch.apply(this.routed, defaultArgs.concat([request, cur]));
                    i += 1;
                }
            } else {
                this._prevBypassedRequest = request;
                this.bypassed.dispatch.apply(this.bypassed, defaultArgs.concat([request]));
            }

            this._pipeParse(request, defaultArgs);
        },

        _notifyPrevRoutes : function(matchedRoutes, request) {
            var i = 0, prev;
            while (prev = this._prevRoutes[i++]) {
                //check if switched exist since route may be disposed
                if(prev.route.switched && this._didSwitch(prev.route, matchedRoutes)) {
                    prev.route.switched.dispatch(request);
                }
            }
        },

        _didSwitch : function (route, matchedRoutes){
            var matched,
                i = 0;
            while (matched = matchedRoutes[i++]) {
                // only dispatch switched if it is going to a different route
                if (matched.route === route) {
                    return false;
                }
            }
            return true;
        },

        _pipeParse : function(request, defaultArgs) {
            var i = 0, route;
            while (route = this._piped[i++]) {
                route.parse(request, defaultArgs);
            }
        },

        getNumRoutes : function () {
            return this._routes.length;
        },

        _sortedInsert : function (route) {
            //simplified insertion sort
            var routes = this._routes,
                n = routes.length;
            do { --n; } while (routes[n] && route._priority <= routes[n]._priority);
            routes.splice(n+1, 0, route);
        },

        _getMatchedRoutes : function (request) {
            var res = [],
                routes = this._routes,
                n = routes.length,
                route;
            //should be decrement loop since higher priorities are added at the end of array
            while (route = routes[--n]) {
                if ((!res.length || this.greedy || route.greedy) && route.match(request)) {
                    res.push({
                        route : route,
                        params : route._getParamsArray(request)
                    });
                }
                if (!this.greedyEnabled && res.length) {
                    break;
                }
            }
            return res;
        },

        pipe : function (otherRouter) {
            this._piped.push(otherRouter);
        },

        unpipe : function (otherRouter) {
            arrayRemove(this._piped, otherRouter);
        },

        toString : function () {
            return '[crossroads numRoutes:'+ this.getNumRoutes() +']';
        }
    };

    //"static" instance
    crossroads = new Crossroads();
    crossroads.VERSION = '0.12.2';

    crossroads.NORM_AS_ARRAY = function (req, vals) {
        return [vals.vals_];
    };

    crossroads.NORM_AS_OBJECT = function (req, vals) {
        return [vals];
    };


    // Route --------------
    //=====================

    /**
     * @constructor
     */
    function Route(pattern, callback, priority, router) {
        var isRegexPattern = isRegExp(pattern),
            patternLexer = router.patternLexer;
        this._router = router;
        this._pattern = pattern;
        this._paramsIds = isRegexPattern? null : patternLexer.getParamIds(pattern);
        this._optionalParamsIds = isRegexPattern? null : patternLexer.getOptionalParamsIds(pattern);
        this._matchRegexp = isRegexPattern? pattern : patternLexer.compilePattern(pattern, router.ignoreCase);
        this.matched = new signals.Signal();
        this.switched = new signals.Signal();
        if (callback) {
            this.matched.add(callback);
        }
        this._priority = priority || 0;
    }

    Route.prototype = {

        greedy : false,

        rules : void(0),

        match : function (request) {
            request = request || '';
            return this._matchRegexp.test(request) && this._validateParams(request); //validate params even if regexp because of `request_` rule.
        },

        _validateParams : function (request) {
            var rules = this.rules,
                values = this._getParamsObject(request),
                key;
            for (key in rules) {
                // normalize_ isn't a validation rule... (#39)
                if(key !== 'normalize_' && rules.hasOwnProperty(key) && ! this._isValidParam(request, key, values)){
                    return false;
                }
            }
            return true;
        },

        _isValidParam : function (request, prop, values) {
            var validationRule = this.rules[prop],
                val = values[prop],
                isValid = false,
                isQuery = (prop.indexOf('?') === 0);

            if (val == null && this._optionalParamsIds && arrayIndexOf(this._optionalParamsIds, prop) !== -1) {
                isValid = true;
            }
            else if (isRegExp(validationRule)) {
                if (isQuery) {
                    val = values[prop +'_']; //use raw string
                }
                isValid = validationRule.test(val);
            }
            else if (isArray(validationRule)) {
                if (isQuery) {
                    val = values[prop +'_']; //use raw string
                }
                isValid = this._isValidArrayRule(validationRule, val);
            }
            else if (isFunction(validationRule)) {
                isValid = validationRule(val, request, values);
            }

            return isValid; //fail silently if validationRule is from an unsupported type
        },

        _isValidArrayRule : function (arr, val) {
            if (! this._router.ignoreCase) {
                return arrayIndexOf(arr, val) !== -1;
            }

            if (typeof val === 'string') {
                val = val.toLowerCase();
            }

            var n = arr.length,
                item,
                compareVal;

            while (n--) {
                item = arr[n];
                compareVal = (typeof item === 'string')? item.toLowerCase() : item;
                if (compareVal === val) {
                    return true;
                }
            }
            return false;
        },

        _getParamsObject : function (request) {
            var shouldTypecast = this._router.shouldTypecast,
                values = this._router.patternLexer.getParamValues(request, this._matchRegexp, shouldTypecast),
                o = {},
                n = values.length,
                param, val;
            while (n--) {
                val = values[n];
                if (this._paramsIds) {
                    param = this._paramsIds[n];
                    if (param.indexOf('?') === 0 && val) {
                        //make a copy of the original string so array and
                        //RegExp validation can be applied properly
                        o[param +'_'] = val;
                        //update vals_ array as well since it will be used
                        //during dispatch
                        val = decodeQueryString(val, shouldTypecast);
                        values[n] = val;
                    }
                    // IE will capture optional groups as empty strings while other
                    // browsers will capture `undefined` so normalize behavior.
                    // see: #gh-58, #gh-59, #gh-60
                    if ( _hasOptionalGroupBug && val === '' && arrayIndexOf(this._optionalParamsIds, param) !== -1 ) {
                        val = void(0);
                        values[n] = val;
                    }
                    o[param] = val;
                }
                //alias to paths and for RegExp pattern
                o[n] = val;
            }
            o.request_ = shouldTypecast? typecastValue(request) : request;
            o.vals_ = values;
            return o;
        },

        _getParamsArray : function (request) {
            var norm = this.rules? this.rules.normalize_ : null,
                params;
            norm = norm || this._router.normalizeFn; // default normalize
            if (norm && isFunction(norm)) {
                params = norm(request, this._getParamsObject(request));
            } else {
                params = this._getParamsObject(request).vals_;
            }
            return params;
        },

        interpolate : function(replacements) {
            var str = this._router.patternLexer.interpolate(this._pattern, replacements);
            if (! this._validateParams(str) ) {
                throw new Error('Generated string doesn\'t validate against `Route.rules`.');
            }
            return str;
        },

        dispose : function () {
            this._router.removeRoute(this);
        },

        _destroy : function () {
            this.matched.dispose();
            this.switched.dispose();
            this.matched = this.switched = this._pattern = this._matchRegexp = null;
        },

        toString : function () {
            return '[Route pattern:"'+ this._pattern +'", numListeners:'+ this.matched.getNumListeners() +']';
        }

    };



    // Pattern Lexer ------
    //=====================

    Crossroads.prototype.patternLexer = (function () {

        var
            //match chars that should be escaped on string regexp
            ESCAPE_CHARS_REGEXP = /[\\.+*?\^$\[\](){}\/'#]/g,

            //trailing slashes (begin/end of string)
            LOOSE_SLASHES_REGEXP = /^\/|\/$/g,
            LEGACY_SLASHES_REGEXP = /\/$/g,

            //params - everything between `{ }` or `: :`
            PARAMS_REGEXP = /(?:\{|:)([^}:]+)(?:\}|:)/g,

            //used to save params during compile (avoid escaping things that
            //shouldn't be escaped).
            TOKENS = {
                'OS' : {
                    //optional slashes
                    //slash between `::` or `}:` or `\w:` or `:{?` or `}{?` or `\w{?`
                    rgx : /([:}]|\w(?=\/))\/?(:|(?:\{\?))/g,
                    save : '$1{{id}}$2',
                    res : '\\/?'
                },
                'RS' : {
                    //required slashes
                    //used to insert slash between `:{` and `}{`
                    rgx : /([:}])\/?(\{)/g,
                    save : '$1{{id}}$2',
                    res : '\\/'
                },
                'RQ' : {
                    //required query string - everything in between `{? }`
                    rgx : /\{\?([^}]+)\}/g,
                    //everything from `?` till `#` or end of string
                    res : '\\?([^#]+)'
                },
                'OQ' : {
                    //optional query string - everything in between `:? :`
                    rgx : /:\?([^:]+):/g,
                    //everything from `?` till `#` or end of string
                    res : '(?:\\?([^#]*))?'
                },
                'OR' : {
                    //optional rest - everything in between `: *:`
                    rgx : /:([^:]+)\*:/g,
                    res : '(.*)?' // optional group to avoid passing empty string as captured
                },
                'RR' : {
                    //rest param - everything in between `{ *}`
                    rgx : /\{([^}]+)\*\}/g,
                    res : '(.+)'
                },
                // required/optional params should come after rest segments
                'RP' : {
                    //required params - everything between `{ }`
                    rgx : /\{([^}]+)\}/g,
                    res : '([^\\/?]+)'
                },
                'OP' : {
                    //optional params - everything between `: :`
                    rgx : /:([^:]+):/g,
                    res : '([^\\/?]+)?\/?'
                }
            },

            LOOSE_SLASH = 1,
            STRICT_SLASH = 2,
            LEGACY_SLASH = 3,

            _slashMode = LOOSE_SLASH;


        function precompileTokens(){
            var key, cur;
            for (key in TOKENS) {
                if (TOKENS.hasOwnProperty(key)) {
                    cur = TOKENS[key];
                    cur.id = '__CR_'+ key +'__';
                    cur.save = ('save' in cur)? cur.save.replace('{{id}}', cur.id) : cur.id;
                    cur.rRestore = new RegExp(cur.id, 'g');
                }
            }
        }
        precompileTokens();


        function captureVals(regex, pattern) {
            var vals = [], match;
            // very important to reset lastIndex since RegExp can have "g" flag
            // and multiple runs might affect the result, specially if matching
            // same string multiple times on IE 7-8
            regex.lastIndex = 0;
            while (match = regex.exec(pattern)) {
                vals.push(match[1]);
            }
            return vals;
        }

        function getParamIds(pattern) {
            return captureVals(PARAMS_REGEXP, pattern);
        }

        function getOptionalParamsIds(pattern) {
            return captureVals(TOKENS.OP.rgx, pattern);
        }

        function compilePattern(pattern, ignoreCase) {
            pattern = pattern || '';

            if(pattern){
                if (_slashMode === LOOSE_SLASH) {
                    pattern = pattern.replace(LOOSE_SLASHES_REGEXP, '');
                }
                else if (_slashMode === LEGACY_SLASH) {
                    pattern = pattern.replace(LEGACY_SLASHES_REGEXP, '');
                }

                //save tokens
                pattern = replaceTokens(pattern, 'rgx', 'save');
                //regexp escape
                pattern = pattern.replace(ESCAPE_CHARS_REGEXP, '\\$&');
                //restore tokens
                pattern = replaceTokens(pattern, 'rRestore', 'res');

                if (_slashMode === LOOSE_SLASH) {
                    pattern = '\\/?'+ pattern;
                }
            }

            if (_slashMode !== STRICT_SLASH) {
                //single slash is treated as empty and end slash is optional
                pattern += '\\/?';
            }
            return new RegExp('^'+ pattern + '$', ignoreCase? 'i' : '');
        }

        function replaceTokens(pattern, regexpName, replaceName) {
            var cur, key;
            for (key in TOKENS) {
                if (TOKENS.hasOwnProperty(key)) {
                    cur = TOKENS[key];
                    pattern = pattern.replace(cur[regexpName], cur[replaceName]);
                }
            }
            return pattern;
        }

        function getParamValues(request, regexp, shouldTypecast) {
            var vals = regexp.exec(request);
            if (vals) {
                vals.shift();
                if (shouldTypecast) {
                    vals = typecastArrayValues(vals);
                }
            }
            return vals;
        }

        function interpolate(pattern, replacements) {
            // default to an empty object because pattern might have just
            // optional arguments
            replacements = replacements || {};
            if (typeof pattern !== 'string') {
                throw new Error('Route pattern should be a string.');
            }

            var replaceFn = function(match, prop){
                    var val;
                    prop = (prop.substr(0, 1) === '?')? prop.substr(1) : prop;
                    if (replacements[prop] != null) {
                        if (typeof replacements[prop] === 'object') {
                            var queryParts = [], rep;
                            for(var key in replacements[prop]) {
                                rep = replacements[prop][key];
                                if (isArray(rep)) {
                                    for (var k in rep) {
                                        if ( key.slice(-2) == '[]' ) {
                                            queryParts.push(encodeURI(key.slice(0, -2)) + '[]=' + encodeURI(rep[k]));
                                        } else {
                                            queryParts.push(encodeURI(key + '=' + rep[k]));
                                        }
                                    }
                                }
                                else {
                                    queryParts.push(encodeURI(key + '=' + rep));
                                }
                            }
                            val = '?' + queryParts.join('&');
                        } else {
                            // make sure value is a string see #gh-54
                            val = String(replacements[prop]);
                        }

                        if (match.indexOf('*') === -1 && val.indexOf('/') !== -1) {
                            throw new Error('Invalid value "'+ val +'" for segment "'+ match +'".');
                        }
                    }
                    else if (match.indexOf('{') !== -1) {
                        throw new Error('The segment '+ match +' is required.');
                    }
                    else {
                        val = '';
                    }
                    return val;
                };

            if (! TOKENS.OS.trail) {
                TOKENS.OS.trail = new RegExp('(?:'+ TOKENS.OS.id +')+$');
            }

            return pattern
                        .replace(TOKENS.OS.rgx, TOKENS.OS.save)
                        .replace(PARAMS_REGEXP, replaceFn)
                        .replace(TOKENS.OS.trail, '') // remove trailing
                        .replace(TOKENS.OS.rRestore, '/'); // add slash between segments
        }

        //API
        return {
            strict : function(){
                _slashMode = STRICT_SLASH;
            },
            loose : function(){
                _slashMode = LOOSE_SLASH;
            },
            legacy : function(){
                _slashMode = LEGACY_SLASH;
            },
            getParamIds : getParamIds,
            getOptionalParamsIds : getOptionalParamsIds,
            getParamValues : getParamValues,
            compilePattern : compilePattern,
            interpolate : interpolate
        };

    }());


    return crossroads;
};

if (typeof define === 'function' && define.amd) {
    define(['signals'], factory);
} else if (typeof module !== 'undefined' && module.exports) { //Node
    module.exports = factory(require('signals'));
} else {
    /*jshint sub:true */
    window['crossroads'] = factory(window['signals']);
}

}());


},{"signals":8}],5:[function(require,module,exports){
function extend(a, b) {
  a._super = b
  for(var key in b) {
    if(b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
    // Does the property have a custom getter or setter?
    if (typeof b.__lookupGetter__(key) == "function") {
      // console.log('found a getter for ' + key);
      a.__defineGetter__(key, b.__lookupGetter__(key))
    }
    if (typeof b.__lookupSetter__(key) == "function") {
      // console.log('found a setter for ' + key);
      a.__defineSetter__(key, b.__lookupSetter__(key))
    }

  }

  return a;
}

module.exports = extend;

},{}],6:[function(require,module,exports){
window.sensible = typeof sensible !== "undefined" ? sensible : {};
sensible.classes = typeof sensible.classes !== "undefined" ? sensible.classes : {};

sensible.classes.Component = require('./js/sensibleComponent.js');

module.exports = sensible.classes.Component;

},{"./js/sensibleComponent.js":7}],7:[function(require,module,exports){
var Component = function (options) {
	var self = this;

	extend = require('extend');

	// Use the private members for custom hidden setters and getters.
	// An identifier for the component's current state.
	var state = '';
	// The element to which this component (el) should be rendered/appended to.
	var target = undefined;

	var defaults = {
		// To log or not to log..
		debug: false,
		el : $(document.createDocumentFragment()),
		stateChange : function(oldState, newState) {
			self.log('Changing state from ' + oldState + ' to ' + newState);
		},
		preload: function() { },
		postload: function() { },
		statePreprocess: function(state) {
			return state;
		},
		// To avoid collisions and incase you want to namespace individual components
		eventNamespace: 'sensible',
		// Call render automatically upon construction becuse sometimes you just want to construct the thing. Disable if the component request data async and should not be show until it is loaded.
		autoRender: true,
	};

	// Supply a default target only as a last resort. This way the body isn't selected every time.
	if (typeof $contentTarget !== "undefined") {
		defaults.target = $contentTarget;
	}
	else if (typeof options !== "undefined" && typeof options.target !== "undefined") {
		target = options.target
	}
	else {
		target = $(document.body);
	}

	this.log = function(msg) {
		if (self.debug) {
			console.log(msg);
		}
	}

	Object.defineProperty(this, 'target', {
		get: function() {
			return target;
		},
		set: function(arg) {
			// If the argument is a string, it is a selector convert it to a jQuery object
			if (typeof arg === "string") {
				target = $(arg);
			}
			else if (arg instanceof jQuery) {
				target = arg
			}
			else {
				console.warn('Unregonized target selector.', arg);
			}
		},
		enumerable: true
	});

	Object.defineProperty(this, 'state', {
		get: function() { return state; },
		set: function(newState) {
			var oldState = state;
			newState = this.statePreprocess(newState);
			state = newState;
			this.stateChange(oldState, newState)
			return true
		},
		enumerable: true
	});

	// $.extend(this, defaults, options);
	self = extend(this, defaults)
	self = extend(this, options)

	// Extend does not trigger custom setters and getters. There are some properties that if defined on init the custom setter/getter is not called. make the assigment manually for these sensitive properties.
	if (options && options.state) {
		this.state = options.state
	}

	this.go = function(newState) {
		this.state = newState;
	}

	// Append the El with all of its markup and events to the targetEl
	this.render = function() {
		self.preload();
		self.log('Rendering..');
		self.target.append(this.el);
		self.postload();
	}

	this.destroy = function() {
		self.target.empty();
	}

	// Call render automatically upon construction
	if (this.autoRender) {
		this.render()
	}

	return this;
}



module.exports = Component;

},{"extend":5}],8:[function(require,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImpzL1BhZ2UuanMiLCJqcy9QYWdlU3RhdGVDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3Nzcm9hZHMvZGlzdC9jcm9zc3JvYWRzLmpzIiwibm9kZV9tb2R1bGVzL2V4dGVuZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zZW5zaWJsZS1jb21wb25lbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2Vuc2libGUtY29tcG9uZW50L2pzL3NlbnNpYmxlQ29tcG9uZW50LmpzIiwibm9kZV9tb2R1bGVzL3NpZ25hbHMvZGlzdC9zaWduYWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFBhZ2VTdGF0ZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2pzL1BhZ2VTdGF0ZUNvbnRyb2xsZXIuanMnKVxuY29uc3QgUGFnZSA9IHJlcXVpcmUoJy4vanMvUGFnZS5qcycpXG4iLCJjb25zdCBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKVxuY29uc3QgQ29tcG9uZW50ID0gcmVxdWlyZSgnc2Vuc2libGUtY29tcG9uZW50JylcblxudmFyIFBhZ2UgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIFRpdGxlIG9mIHRoZSBwYWdlLiBBcHBlYXJzIGluIGhpc3RvcnksIGJvb2ttYXJrcywgYW5kIHRhYnNcbiAgdmFyIHRpdGxlID0gXCJcIjtcbiAgLy8gU3VmZml4IGxpa2UgdGhlIG5hbWUgb2YgdGhlIGFwcCwgZXRjLlxuICB2YXIgc3VmZml4ID0gXCJcIjtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3RpdGxlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aXRsZTsgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKG5ld1RpdGxlKSB7XG4gICAgICB0aXRsZSA9IG5ld1RpdGxlO1xuICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSArIHRoaXMuc3VmZml4O1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdWZmaXgnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHN1ZmZpeDsgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKG5ld1N1ZmZpeCkge1xuICAgICAgc3VmZml4ID0gbmV3U3VmZml4O1xuICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aGlzLnRpdGxlICsgc3VmZml4O1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSk7XG5cbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIC8vIEEgc3BlY2lhbCBjaGFyYWN0ZXIgYWZ0ZXIgd2hpY2ggaW4gdGhlIHN0YXRlIHNob3VsZCBiZSBzb21lIHNlbGVjdG9yIGZvciBhbiBlbGVtZW50IHRvIHNjcm9sbCB0b1xuICAgIGZyYWdtZW50Q2hhcmFjdGVyOiBcIiNcIixcbiAgICAvLyBUaGUgY3VycmVudCBmcmFnbWVudCBsYXN0IHNjcm9sbGVkIHRvXG4gICAgZnJhZ21lbnQ6IFwiXCIsXG4gICAgLy8gQ3VzdG9taXphYmxlIHBvc3QtbG9hZCBmdW5jdGlvblxuICAgIHBvc3Rsb2FkOiBmdW5jdGlvbigpIHsgfVxuICB9XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBkZWZhdWx0cyk7XG4gIHNlbGYgPSBleHRlbmQoc2VsZiwgb3B0aW9ucyk7XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBuZXcgQ29tcG9uZW50KHNlbGYpKTtcblxuICAkKHRoaXMudGFyZ2V0KS5vbigncG9zdGxvYWQucGFnZScsIHRoaXMucG9zdGxvYWQpO1xuXG4gIHRoaXMuc3RhdGVDaGFuZ2UgPSBmdW5jdGlvbihvbGRTdGF0ZSwgbmV3U3RhdGUpIHtcbiAgICBzZWxmLmxvZygnTmV3IHN0YXRlOiAnICsgbmV3U3RhdGUpXG4gICAgJCh0aGlzLnRhcmdldCkudHJpZ2dlcigncG9zdGxvYWQuJyArIHNlbGYuZXZlbnROYW1lc3BhY2UpO1xuICB9XG5cbiAgLy8gQSBhbGdvcml0aG0gZm9yIHNlbGVjdGluZyBlbGVtZW50cyB1c2luZyBhIHN0cmluZyBpbiB0aGUgZnJhZ21lbnQuIFNlbGVjdCB0aGUgcCBvZiB0eXBlIG9mIGEgbnVtYmVyLiBTZWxlY3QgdGhlIGlkIGlmIG5vdC5cblx0dmFyIGZyYWdtZW50RmluZCA9IGZ1bmN0aW9uKGZyYWdtZW50KSB7XG5cdFx0dmFyIHNlbGVjdG9yLCBqdW1wVGFyZ2V0O1xuXHRcdGlmIChOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlSW50KGZyYWdtZW50KSApKSB7XG5cdFx0XHRzZWxmLmxvZygnRnJhZ21lbnQgaXMgYSBudW1iZXIuLicpXG5cdFx0XHRzZWxlY3RvciA9ICdwOmVxKCcgKyBmcmFnbWVudCArICcpJ1xuXHRcdFx0anVtcFRhcmdldCA9IHNlbGYudGFyZ2V0LmZpbmQoc2VsZWN0b3IpXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0c2VsZWN0b3IgPSAnIycgKyBmcmFnbWVudDtcblx0XHRcdGp1bXBUYXJnZXQgPSBzZWxmLnRhcmdldC5maW5kKHNlbGVjdG9yKTtcblx0XHRcdC8vIElmIHdyYXBwZWQgaW4gYSBnbG93LXNwYW4sIGdsb3cgaXQsIHRoZSBwYXJlbnQsIGluc3RlYWQuXG5cdFx0XHR2YXIganVtcFRhcmdldFBhcmVudCA9IGp1bXBUYXJnZXQucGFyZW50KCk7XG5cdFx0XHRpZiAoanVtcFRhcmdldFBhcmVudC5oYXNDbGFzcygnZ2xvdy1zcGFuJykpIHtcblx0XHRcdFx0anVtcFRhcmdldCA9IGp1bXBUYXJnZXRQYXJlbnQ7XG5cdFx0XHR9XG5cdFx0fVxuXG4gICAgdmFyIGlzSnVtcFRhcmdldEZvdW5kID0ganVtcFRhcmdldC5sZW5ndGggPiAwO1xuICAgIHZhciBpc1RhcmdldGluRE9NID0gdHlwZW9mIGp1bXBUYXJnZXQub2Zmc2V0ICE9PSBcInVuZGVmaW5lZFwiO1xuICAgIGlmICghaXNKdW1wVGFyZ2V0Rm91bmQpIHtcbiAgICAgIGNvbnNvbGUud2FybignQXR0ZW1wdGluZyB0byBzY3JvbGwgdG8gYSBlbGVtZW50IHRoYXQgZG9lcyBub3QgZXhpc3QuICcsIHNlbGVjdG9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFpc1RhcmdldGluRE9NKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Njcm9sbGluZyB0byBhIGVsZW1lbnQgdGhhdCBpc250IGluIHRoZSBET00uIEV4aXRpbmcuLicsIGp1bXBUYXJnZXQpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXHRcdHJldHVybiBqdW1wVGFyZ2V0O1xuXHR9XG5cbiAgLy8gUHJvY2VzcyB0aGUgZnJhZ21lbnQgb24gdGhlIHN0YXRlXG4gICQodGhpcy50YXJnZXQpLm9uKCdwb3N0bG9hZC4nICsgdGhpcy5ldmVudE5hbWVzcGFjZSwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5mcmFnbWVudCA9IHNlbGYuc3RhdGUuc3BsaXQoc2VsZi5mcmFnbWVudENoYXJhY3RlcilbMV1cblxuICAgIGlmICh0eXBlb2Ygc2VsZi5mcmFnbWVudCA9PT0gXCJ1bmRlZmluZWRcIiB8fCBzZWxmLmZyYWdtZW50Lmxlbmd0aCA8PSAwKSB7XG4gICAgICBzZWxmLmxvZygnTm8gZnJhZ21lbnQuIEV4aXRpbmcuLiBTdGF0ZTogJyArIHNlbGYuc3RhdGUpXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbFRhcmdldCA9IGZyYWdtZW50RmluZChzZWxmLmZyYWdtZW50KTtcblxuICAgIGlmIChzY3JvbGxUYXJnZXQgPT0gZmFsc2UpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cbiAgICB2YXIgZGlzdGFuY2VUb1Njcm9sbCA9IHNjcm9sbFRhcmdldC5vZmZzZXQoKS50b3A7XG5cbiAgICAkKCdodG1sLCBib2R5Jykuc2Nyb2xsVG9wKGRpc3RhbmNlVG9TY3JvbGwpO1xuICB9KTtcblxuICAkKHRoaXMudGFyZ2V0KS50cmlnZ2VyKCdwb3N0bG9hZC4nICsgdGhpcy5ldmVudE5hbWVzcGFjZSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2U7XG4iLCJjb25zdCBjcm9zc3JvYWRzID0gcmVxdWlyZSgnY3Jvc3Nyb2FkcycpO1xuY29uc3QgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbnZhciBQYWdlU3RhdGVDb250cm9sbGVyID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgdGFyZ2V0OiAnYm9keScsXG4gICAgc3RhdGU6ICcnLFxuICAgIHJvdXRlczoge30sXG4gICAgcHJlcHJvY2Vzc1N0YXRlOiBmdW5jdGlvbihsb2NhdGlvbikge1xuICAgICAgcmV0dXJuIGxvY2F0aW9uO1xuICAgIH0sXG4gICAgLy8gRGVmaW5lIGFuIGV2ZW50IG5hbWUgZm9yIGFuIGV2ZW50IHRvIHRyaWdnZXIgd2hlbiB0aGlzIGNvbXBvbmVudCBnb2VzLlxuICAgIGV2ZW50TmFtZTogdW5kZWZpbmVkLFxuICAgIGRlYnVnOiBmYWxzZVxuICB9XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBkZWZhdWx0cylcbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBvcHRpb25zKVxuXG4gIHRoaXMubG9nID0gZnVuY3Rpb24obXNnKSB7XG5cdFx0aWYgKHNlbGYuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKG1zZyk7XG5cdFx0fVxuXHR9XG5cbiAgdGhpcy50YXJnZXRFbCA9ICQodGhpcy50YXJnZXQpO1xuXG4gIC8vIENhc3QgXCJ1bmRlZmluZWRcIiBzdHJpbmdzIGFzIGxpdGVyYWwgdW5kZWZpbmVkXG4gIGNyb3Nzcm9hZHMuc2hvdWxkVHlwZWNhc3QgPSB0cnVlXG4gIC8vIEFsbG93IHRoZSBzYW1lIHJvdXRlIHRvIHJ1biB0d2ljZVxuICBjcm9zc3JvYWRzLmlnbm9yZVN0YXRlID0gdHJ1ZVxuXG4gIC8vIEFkZCB0aGUgcm91dGVzIHRvIGNyb3Nzcm9hZHMuXG4gIGZvcih2YXIgciBpbiB0aGlzLnJvdXRlcykge1xuICAgIHRoaXMubG9nKCdBZGRlZCByb3V0ZSBmb3I6ICcsIHIpO1xuICAgIGNyb3Nzcm9hZHMuYWRkUm91dGUociwgdGhpcy5yb3V0ZXNbcl0pO1xuICB9XG5cbiAgdGhpcy5nbyA9IGZ1bmN0aW9uKCkgeztcbiAgICB2YXIgb2xkU3RhdGUgPSBzZWxmLnN0YXRlO1xuICAgIHNlbGYuc3RhdGUgPSBzZWxmLnByZXByb2Nlc3NTdGF0ZSh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB3aW5kb3cubG9jYXRpb24uaGFzaCk7XG4gICAgdmFyIG5ld1N0YXRlID0gc2VsZi5zdGF0ZTtcblxuICAgIGlmIChzZWxmLnN0YXRlID09ICcnKSB7XG4gICAgICBzZWxmLmxvZygnUGFnZSBTdGF0ZSBDb250cm9sbGVyIGdvaW5nIHdpdGggYW4gZW1wdHkgc3RhdGUuIEV4aXRpbmcuLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gUm91dGVzIEFjdGlvbnMuXG4gICAgc2VsZi5sb2coJ1BhcnNpbmcgUm91dGU6ICcgKyBzZWxmLnN0YXRlKVxuICAgIGNyb3Nzcm9hZHMucGFyc2Uoc2VsZi5zdGF0ZSk7XG5cblxuICAgIGlmICh0eXBlb2Ygc2VsZi5ldmVudE5hbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICQoZG9jdW1lbnQuYm9keSkudHJpZ2dlcihzZWxmLmV2ZW50TmFtZSwgW29sZFN0YXRlLCBuZXdTdGF0ZV0gKTtcbiAgICB9XG4gIH1cblxuICAkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5sb2coJ1BvcCBTdGF0ZSBmaXJlZCEnKTtcbiAgICBzZWxmLmdvKCk7XG4gIH0pO1xuXG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgc2VsZi5sb2coJ0RvY3VtZW50IHJlYWR5LicpO1xuICAgIHNlbGYuZ28oKTtcbiAgfVxuICBlbHNlIHtcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYubG9nKCdEb2N1bWVudCByZWFkeS4nKTtcbiAgICAgIHNlbGYuZ28oKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VTdGF0ZUNvbnRyb2xsZXI7XG4iLCIvKiogQGxpY2Vuc2VcbiAqIGNyb3Nzcm9hZHMgPGh0dHA6Ly9taWxsZXJtZWRlaXJvcy5naXRodWIuY29tL2Nyb3Nzcm9hZHMuanMvPlxuICogQXV0aG9yOiBNaWxsZXIgTWVkZWlyb3MgfCBNSVQgTGljZW5zZVxuICogdjAuMTIuMiAoMjAxNS8wNy8zMSAxODozNylcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xudmFyIGZhY3RvcnkgPSBmdW5jdGlvbiAoc2lnbmFscykge1xuXG4gICAgdmFyIGNyb3Nzcm9hZHMsXG4gICAgICAgIF9oYXNPcHRpb25hbEdyb3VwQnVnLFxuICAgICAgICBVTkRFRjtcblxuICAgIC8vIEhlbHBlcnMgLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvLyBJRSA3LTggY2FwdHVyZSBvcHRpb25hbCBncm91cHMgYXMgZW1wdHkgc3RyaW5ncyB3aGlsZSBvdGhlciBicm93c2Vyc1xuICAgIC8vIGNhcHR1cmUgYXMgYHVuZGVmaW5lZGBcbiAgICBfaGFzT3B0aW9uYWxHcm91cEJ1ZyA9ICgvdCguKyk/LykuZXhlYygndCcpWzFdID09PSAnJztcblxuICAgIGZ1bmN0aW9uIGFycmF5SW5kZXhPZihhcnIsIHZhbCkge1xuICAgICAgICBpZiAoYXJyLmluZGV4T2YpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnIuaW5kZXhPZih2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9BcnJheS5pbmRleE9mIGRvZXNuJ3Qgd29yayBvbiBJRSA2LTdcbiAgICAgICAgICAgIHZhciBuID0gYXJyLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyW25dID09PSB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXJyYXlSZW1vdmUoYXJyLCBpdGVtKSB7XG4gICAgICAgIHZhciBpID0gYXJyYXlJbmRleE9mKGFyciwgaXRlbSk7XG4gICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgYXJyLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzS2luZCh2YWwsIGtpbmQpIHtcbiAgICAgICAgcmV0dXJuICdbb2JqZWN0ICcrIGtpbmQgKyddJyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNSZWdFeHAodmFsKSB7XG4gICAgICAgIHJldHVybiBpc0tpbmQodmFsLCAnUmVnRXhwJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNBcnJheSh2YWwpIHtcbiAgICAgICAgcmV0dXJuIGlzS2luZCh2YWwsICdBcnJheScpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nO1xuICAgIH1cblxuICAgIC8vYm9ycm93ZWQgZnJvbSBBTUQtdXRpbHNcbiAgICBmdW5jdGlvbiB0eXBlY2FzdFZhbHVlKHZhbCkge1xuICAgICAgICB2YXIgcjtcbiAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09ICdudWxsJykge1xuICAgICAgICAgICAgciA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgIHIgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgciA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gVU5ERUYgfHwgdmFsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgciA9IFVOREVGO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJycgfHwgaXNOYU4odmFsKSkge1xuICAgICAgICAgICAgLy9pc05hTignJykgcmV0dXJucyBmYWxzZVxuICAgICAgICAgICAgciA9IHZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vcGFyc2VGbG9hdChudWxsIHx8ICcnKSByZXR1cm5zIE5hTlxuICAgICAgICAgICAgciA9IHBhcnNlRmxvYXQodmFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0eXBlY2FzdEFycmF5VmFsdWVzKHZhbHVlcykge1xuICAgICAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGgsXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgcmVzdWx0W25dID0gdHlwZWNhc3RWYWx1ZSh2YWx1ZXNbbl0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLy8gYm9ycm93ZWQgZnJvbSBNT1VUXG4gICAgZnVuY3Rpb24gZGVjb2RlUXVlcnlTdHJpbmcocXVlcnlTdHIsIHNob3VsZFR5cGVjYXN0KSB7XG4gICAgICAgIHZhciBxdWVyeUFyciA9IChxdWVyeVN0ciB8fCAnJykucmVwbGFjZSgnPycsICcnKS5zcGxpdCgnJicpLFxuICAgICAgICAgICAgcmVnID0gLyhbXj1dKyk9KC4rKS8sXG4gICAgICAgICAgICBpID0gLTEsXG4gICAgICAgICAgICBvYmogPSB7fSxcbiAgICAgICAgICAgIGVxdWFsSW5kZXgsIGN1ciwgcFZhbHVlLCBwTmFtZTtcblxuICAgICAgICB3aGlsZSAoKGN1ciA9IHF1ZXJ5QXJyWysraV0pKSB7XG4gICAgICAgICAgICBlcXVhbEluZGV4ID0gY3VyLmluZGV4T2YoJz0nKTtcbiAgICAgICAgICAgIHBOYW1lID0gY3VyLnN1YnN0cmluZygwLCBlcXVhbEluZGV4KTtcbiAgICAgICAgICAgIHBWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChjdXIuc3Vic3RyaW5nKGVxdWFsSW5kZXggKyAxKSk7XG4gICAgICAgICAgICBpZiAoc2hvdWxkVHlwZWNhc3QgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcFZhbHVlID0gdHlwZWNhc3RWYWx1ZShwVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBOYW1lIGluIG9iail7XG4gICAgICAgICAgICAgICAgaWYoaXNBcnJheShvYmpbcE5hbWVdKSl7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwTmFtZV0ucHVzaChwVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtwTmFtZV0gPSBbb2JqW3BOYW1lXSwgcFZhbHVlXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9ialtwTmFtZV0gPSBwVmFsdWU7XG4gICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuXG4gICAgLy8gQ3Jvc3Nyb2FkcyAtLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIENyb3Nzcm9hZHMoKSB7XG4gICAgICAgIHRoaXMuYnlwYXNzZWQgPSBuZXcgc2lnbmFscy5TaWduYWwoKTtcbiAgICAgICAgdGhpcy5yb3V0ZWQgPSBuZXcgc2lnbmFscy5TaWduYWwoKTtcbiAgICAgICAgdGhpcy5fcm91dGVzID0gW107XG4gICAgICAgIHRoaXMuX3ByZXZSb3V0ZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGlwZWQgPSBbXTtcbiAgICAgICAgdGhpcy5yZXNldFN0YXRlKCk7XG4gICAgfVxuXG4gICAgQ3Jvc3Nyb2Fkcy5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgZ3JlZWR5IDogZmFsc2UsXG5cbiAgICAgICAgZ3JlZWR5RW5hYmxlZCA6IHRydWUsXG5cbiAgICAgICAgaWdub3JlQ2FzZSA6IHRydWUsXG5cbiAgICAgICAgaWdub3JlU3RhdGUgOiBmYWxzZSxcblxuICAgICAgICBzaG91bGRUeXBlY2FzdCA6IGZhbHNlLFxuXG4gICAgICAgIG5vcm1hbGl6ZUZuIDogbnVsbCxcblxuICAgICAgICByZXNldFN0YXRlIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZSb3V0ZXMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZNYXRjaGVkUmVxdWVzdCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9wcmV2QnlwYXNzZWRSZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENyb3Nzcm9hZHMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRSb3V0ZSA6IGZ1bmN0aW9uIChwYXR0ZXJuLCBjYWxsYmFjaywgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXR0ZXJuLCBjYWxsYmFjaywgcHJpb3JpdHksIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fc29ydGVkSW5zZXJ0KHJvdXRlKTtcbiAgICAgICAgICAgIHJldHVybiByb3V0ZTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW1vdmVSb3V0ZSA6IGZ1bmN0aW9uIChyb3V0ZSkge1xuICAgICAgICAgICAgYXJyYXlSZW1vdmUodGhpcy5fcm91dGVzLCByb3V0ZSk7XG4gICAgICAgICAgICByb3V0ZS5fZGVzdHJveSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZUFsbFJvdXRlcyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5nZXROdW1Sb3V0ZXMoKTtcbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXNbbl0uX2Rlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3JvdXRlcy5sZW5ndGggPSAwO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlIDogZnVuY3Rpb24gKHJlcXVlc3QsIGRlZmF1bHRBcmdzKSB7XG4gICAgICAgICAgICByZXF1ZXN0ID0gcmVxdWVzdCB8fCAnJztcbiAgICAgICAgICAgIGRlZmF1bHRBcmdzID0gZGVmYXVsdEFyZ3MgfHwgW107XG5cbiAgICAgICAgICAgIC8vIHNob3VsZCBvbmx5IGNhcmUgYWJvdXQgZGlmZmVyZW50IHJlcXVlc3RzIGlmIGlnbm9yZVN0YXRlIGlzbid0IHRydWVcbiAgICAgICAgICAgIGlmICggIXRoaXMuaWdub3JlU3RhdGUgJiZcbiAgICAgICAgICAgICAgICAocmVxdWVzdCA9PT0gdGhpcy5fcHJldk1hdGNoZWRSZXF1ZXN0IHx8XG4gICAgICAgICAgICAgICAgIHJlcXVlc3QgPT09IHRoaXMuX3ByZXZCeXBhc3NlZFJlcXVlc3QpICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJvdXRlcyA9IHRoaXMuX2dldE1hdGNoZWRSb3V0ZXMocmVxdWVzdCksXG4gICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgbiA9IHJvdXRlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgY3VyO1xuXG4gICAgICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXZNYXRjaGVkUmVxdWVzdCA9IHJlcXVlc3Q7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9ub3RpZnlQcmV2Um91dGVzKHJvdXRlcywgcmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJldlJvdXRlcyA9IHJvdXRlcztcbiAgICAgICAgICAgICAgICAvL3Nob3VsZCBiZSBpbmNyZW1lbnRhbCBsb29wLCBleGVjdXRlIHJvdXRlcyBpbiBvcmRlclxuICAgICAgICAgICAgICAgIHdoaWxlIChpIDwgbikge1xuICAgICAgICAgICAgICAgICAgICBjdXIgPSByb3V0ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGN1ci5yb3V0ZS5tYXRjaGVkLmRpc3BhdGNoLmFwcGx5KGN1ci5yb3V0ZS5tYXRjaGVkLCBkZWZhdWx0QXJncy5jb25jYXQoY3VyLnBhcmFtcykpO1xuICAgICAgICAgICAgICAgICAgICBjdXIuaXNGaXJzdCA9ICFpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdXRlZC5kaXNwYXRjaC5hcHBseSh0aGlzLnJvdXRlZCwgZGVmYXVsdEFyZ3MuY29uY2F0KFtyZXF1ZXN0LCBjdXJdKSk7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXZCeXBhc3NlZFJlcXVlc3QgPSByZXF1ZXN0O1xuICAgICAgICAgICAgICAgIHRoaXMuYnlwYXNzZWQuZGlzcGF0Y2guYXBwbHkodGhpcy5ieXBhc3NlZCwgZGVmYXVsdEFyZ3MuY29uY2F0KFtyZXF1ZXN0XSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9waXBlUGFyc2UocmVxdWVzdCwgZGVmYXVsdEFyZ3MpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9ub3RpZnlQcmV2Um91dGVzIDogZnVuY3Rpb24obWF0Y2hlZFJvdXRlcywgcmVxdWVzdCkge1xuICAgICAgICAgICAgdmFyIGkgPSAwLCBwcmV2O1xuICAgICAgICAgICAgd2hpbGUgKHByZXYgPSB0aGlzLl9wcmV2Um91dGVzW2krK10pIHtcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGlmIHN3aXRjaGVkIGV4aXN0IHNpbmNlIHJvdXRlIG1heSBiZSBkaXNwb3NlZFxuICAgICAgICAgICAgICAgIGlmKHByZXYucm91dGUuc3dpdGNoZWQgJiYgdGhpcy5fZGlkU3dpdGNoKHByZXYucm91dGUsIG1hdGNoZWRSb3V0ZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXYucm91dGUuc3dpdGNoZWQuZGlzcGF0Y2gocmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9kaWRTd2l0Y2ggOiBmdW5jdGlvbiAocm91dGUsIG1hdGNoZWRSb3V0ZXMpe1xuICAgICAgICAgICAgdmFyIG1hdGNoZWQsXG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICB3aGlsZSAobWF0Y2hlZCA9IG1hdGNoZWRSb3V0ZXNbaSsrXSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgZGlzcGF0Y2ggc3dpdGNoZWQgaWYgaXQgaXMgZ29pbmcgdG8gYSBkaWZmZXJlbnQgcm91dGVcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlZC5yb3V0ZSA9PT0gcm91dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9waXBlUGFyc2UgOiBmdW5jdGlvbihyZXF1ZXN0LCBkZWZhdWx0QXJncykge1xuICAgICAgICAgICAgdmFyIGkgPSAwLCByb3V0ZTtcbiAgICAgICAgICAgIHdoaWxlIChyb3V0ZSA9IHRoaXMuX3BpcGVkW2krK10pIHtcbiAgICAgICAgICAgICAgICByb3V0ZS5wYXJzZShyZXF1ZXN0LCBkZWZhdWx0QXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TnVtUm91dGVzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JvdXRlcy5sZW5ndGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NvcnRlZEluc2VydCA6IGZ1bmN0aW9uIChyb3V0ZSkge1xuICAgICAgICAgICAgLy9zaW1wbGlmaWVkIGluc2VydGlvbiBzb3J0XG4gICAgICAgICAgICB2YXIgcm91dGVzID0gdGhpcy5fcm91dGVzLFxuICAgICAgICAgICAgICAgIG4gPSByb3V0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgZG8geyAtLW47IH0gd2hpbGUgKHJvdXRlc1tuXSAmJiByb3V0ZS5fcHJpb3JpdHkgPD0gcm91dGVzW25dLl9wcmlvcml0eSk7XG4gICAgICAgICAgICByb3V0ZXMuc3BsaWNlKG4rMSwgMCwgcm91dGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRNYXRjaGVkUm91dGVzIDogZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBbXSxcbiAgICAgICAgICAgICAgICByb3V0ZXMgPSB0aGlzLl9yb3V0ZXMsXG4gICAgICAgICAgICAgICAgbiA9IHJvdXRlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcm91dGU7XG4gICAgICAgICAgICAvL3Nob3VsZCBiZSBkZWNyZW1lbnQgbG9vcCBzaW5jZSBoaWdoZXIgcHJpb3JpdGllcyBhcmUgYWRkZWQgYXQgdGhlIGVuZCBvZiBhcnJheVxuICAgICAgICAgICAgd2hpbGUgKHJvdXRlID0gcm91dGVzWy0tbl0pIHtcbiAgICAgICAgICAgICAgICBpZiAoKCFyZXMubGVuZ3RoIHx8IHRoaXMuZ3JlZWR5IHx8IHJvdXRlLmdyZWVkeSkgJiYgcm91dGUubWF0Y2gocmVxdWVzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgcm91dGUgOiByb3V0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcyA6IHJvdXRlLl9nZXRQYXJhbXNBcnJheShyZXF1ZXN0KVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmdyZWVkeUVuYWJsZWQgJiYgcmVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBpcGUgOiBmdW5jdGlvbiAob3RoZXJSb3V0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3BpcGVkLnB1c2gob3RoZXJSb3V0ZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVucGlwZSA6IGZ1bmN0aW9uIChvdGhlclJvdXRlcikge1xuICAgICAgICAgICAgYXJyYXlSZW1vdmUodGhpcy5fcGlwZWQsIG90aGVyUm91dGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnW2Nyb3Nzcm9hZHMgbnVtUm91dGVzOicrIHRoaXMuZ2V0TnVtUm91dGVzKCkgKyddJztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1wic3RhdGljXCIgaW5zdGFuY2VcbiAgICBjcm9zc3JvYWRzID0gbmV3IENyb3Nzcm9hZHMoKTtcbiAgICBjcm9zc3JvYWRzLlZFUlNJT04gPSAnMC4xMi4yJztcblxuICAgIGNyb3Nzcm9hZHMuTk9STV9BU19BUlJBWSA9IGZ1bmN0aW9uIChyZXEsIHZhbHMpIHtcbiAgICAgICAgcmV0dXJuIFt2YWxzLnZhbHNfXTtcbiAgICB9O1xuXG4gICAgY3Jvc3Nyb2Fkcy5OT1JNX0FTX09CSkVDVCA9IGZ1bmN0aW9uIChyZXEsIHZhbHMpIHtcbiAgICAgICAgcmV0dXJuIFt2YWxzXTtcbiAgICB9O1xuXG5cbiAgICAvLyBSb3V0ZSAtLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBSb3V0ZShwYXR0ZXJuLCBjYWxsYmFjaywgcHJpb3JpdHksIHJvdXRlcikge1xuICAgICAgICB2YXIgaXNSZWdleFBhdHRlcm4gPSBpc1JlZ0V4cChwYXR0ZXJuKSxcbiAgICAgICAgICAgIHBhdHRlcm5MZXhlciA9IHJvdXRlci5wYXR0ZXJuTGV4ZXI7XG4gICAgICAgIHRoaXMuX3JvdXRlciA9IHJvdXRlcjtcbiAgICAgICAgdGhpcy5fcGF0dGVybiA9IHBhdHRlcm47XG4gICAgICAgIHRoaXMuX3BhcmFtc0lkcyA9IGlzUmVnZXhQYXR0ZXJuPyBudWxsIDogcGF0dGVybkxleGVyLmdldFBhcmFtSWRzKHBhdHRlcm4pO1xuICAgICAgICB0aGlzLl9vcHRpb25hbFBhcmFtc0lkcyA9IGlzUmVnZXhQYXR0ZXJuPyBudWxsIDogcGF0dGVybkxleGVyLmdldE9wdGlvbmFsUGFyYW1zSWRzKHBhdHRlcm4pO1xuICAgICAgICB0aGlzLl9tYXRjaFJlZ2V4cCA9IGlzUmVnZXhQYXR0ZXJuPyBwYXR0ZXJuIDogcGF0dGVybkxleGVyLmNvbXBpbGVQYXR0ZXJuKHBhdHRlcm4sIHJvdXRlci5pZ25vcmVDYXNlKTtcbiAgICAgICAgdGhpcy5tYXRjaGVkID0gbmV3IHNpZ25hbHMuU2lnbmFsKCk7XG4gICAgICAgIHRoaXMuc3dpdGNoZWQgPSBuZXcgc2lnbmFscy5TaWduYWwoKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm1hdGNoZWQuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgfVxuXG4gICAgUm91dGUucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGdyZWVkeSA6IGZhbHNlLFxuXG4gICAgICAgIHJ1bGVzIDogdm9pZCgwKSxcblxuICAgICAgICBtYXRjaCA6IGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICByZXF1ZXN0ID0gcmVxdWVzdCB8fCAnJztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXRjaFJlZ2V4cC50ZXN0KHJlcXVlc3QpICYmIHRoaXMuX3ZhbGlkYXRlUGFyYW1zKHJlcXVlc3QpOyAvL3ZhbGlkYXRlIHBhcmFtcyBldmVuIGlmIHJlZ2V4cCBiZWNhdXNlIG9mIGByZXF1ZXN0X2AgcnVsZS5cbiAgICAgICAgfSxcblxuICAgICAgICBfdmFsaWRhdGVQYXJhbXMgOiBmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAgICAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlcyxcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSB0aGlzLl9nZXRQYXJhbXNPYmplY3QocmVxdWVzdCksXG4gICAgICAgICAgICAgICAga2V5O1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gcnVsZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBub3JtYWxpemVfIGlzbid0IGEgdmFsaWRhdGlvbiBydWxlLi4uICgjMzkpXG4gICAgICAgICAgICAgICAgaWYoa2V5ICE9PSAnbm9ybWFsaXplXycgJiYgcnVsZXMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAhIHRoaXMuX2lzVmFsaWRQYXJhbShyZXF1ZXN0LCBrZXksIHZhbHVlcykpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2lzVmFsaWRQYXJhbSA6IGZ1bmN0aW9uIChyZXF1ZXN0LCBwcm9wLCB2YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZGF0aW9uUnVsZSA9IHRoaXMucnVsZXNbcHJvcF0sXG4gICAgICAgICAgICAgICAgdmFsID0gdmFsdWVzW3Byb3BdLFxuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc1F1ZXJ5ID0gKHByb3AuaW5kZXhPZignPycpID09PSAwKTtcblxuICAgICAgICAgICAgaWYgKHZhbCA9PSBudWxsICYmIHRoaXMuX29wdGlvbmFsUGFyYW1zSWRzICYmIGFycmF5SW5kZXhPZih0aGlzLl9vcHRpb25hbFBhcmFtc0lkcywgcHJvcCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc1JlZ0V4cCh2YWxpZGF0aW9uUnVsZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWx1ZXNbcHJvcCArJ18nXTsgLy91c2UgcmF3IHN0cmluZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdmFsaWRhdGlvblJ1bGUudGVzdCh2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNBcnJheSh2YWxpZGF0aW9uUnVsZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSB2YWx1ZXNbcHJvcCArJ18nXTsgLy91c2UgcmF3IHN0cmluZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdGhpcy5faXNWYWxpZEFycmF5UnVsZSh2YWxpZGF0aW9uUnVsZSwgdmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRnVuY3Rpb24odmFsaWRhdGlvblJ1bGUpKSB7XG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IHZhbGlkYXRpb25SdWxlKHZhbCwgcmVxdWVzdCwgdmFsdWVzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGlzVmFsaWQ7IC8vZmFpbCBzaWxlbnRseSBpZiB2YWxpZGF0aW9uUnVsZSBpcyBmcm9tIGFuIHVuc3VwcG9ydGVkIHR5cGVcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNWYWxpZEFycmF5UnVsZSA6IGZ1bmN0aW9uIChhcnIsIHZhbCkge1xuICAgICAgICAgICAgaWYgKCEgdGhpcy5fcm91dGVyLmlnbm9yZUNhc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXlJbmRleE9mKGFyciwgdmFsKSAhPT0gLTE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHZhbCA9IHZhbC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbiA9IGFyci5sZW5ndGgsXG4gICAgICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgICAgICBjb21wYXJlVmFsO1xuXG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IGFycltuXTtcbiAgICAgICAgICAgICAgICBjb21wYXJlVmFsID0gKHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJyk/IGl0ZW0udG9Mb3dlckNhc2UoKSA6IGl0ZW07XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBhcmVWYWwgPT09IHZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFBhcmFtc09iamVjdCA6IGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICB2YXIgc2hvdWxkVHlwZWNhc3QgPSB0aGlzLl9yb3V0ZXIuc2hvdWxkVHlwZWNhc3QsXG4gICAgICAgICAgICAgICAgdmFsdWVzID0gdGhpcy5fcm91dGVyLnBhdHRlcm5MZXhlci5nZXRQYXJhbVZhbHVlcyhyZXF1ZXN0LCB0aGlzLl9tYXRjaFJlZ2V4cCwgc2hvdWxkVHlwZWNhc3QpLFxuICAgICAgICAgICAgICAgIG8gPSB7fSxcbiAgICAgICAgICAgICAgICBuID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBwYXJhbSwgdmFsO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIHZhbCA9IHZhbHVlc1tuXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGFyYW1zSWRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtID0gdGhpcy5fcGFyYW1zSWRzW25dO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0uaW5kZXhPZignPycpID09PSAwICYmIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9tYWtlIGEgY29weSBvZiB0aGUgb3JpZ2luYWwgc3RyaW5nIHNvIGFycmF5IGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy9SZWdFeHAgdmFsaWRhdGlvbiBjYW4gYmUgYXBwbGllZCBwcm9wZXJseVxuICAgICAgICAgICAgICAgICAgICAgICAgb1twYXJhbSArJ18nXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdXBkYXRlIHZhbHNfIGFycmF5IGFzIHdlbGwgc2luY2UgaXQgd2lsbCBiZSB1c2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2R1cmluZyBkaXNwYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gZGVjb2RlUXVlcnlTdHJpbmcodmFsLCBzaG91bGRUeXBlY2FzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbbl0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gSUUgd2lsbCBjYXB0dXJlIG9wdGlvbmFsIGdyb3VwcyBhcyBlbXB0eSBzdHJpbmdzIHdoaWxlIG90aGVyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJyb3dzZXJzIHdpbGwgY2FwdHVyZSBgdW5kZWZpbmVkYCBzbyBub3JtYWxpemUgYmVoYXZpb3IuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlZTogI2doLTU4LCAjZ2gtNTksICNnaC02MFxuICAgICAgICAgICAgICAgICAgICBpZiAoIF9oYXNPcHRpb25hbEdyb3VwQnVnICYmIHZhbCA9PT0gJycgJiYgYXJyYXlJbmRleE9mKHRoaXMuX29wdGlvbmFsUGFyYW1zSWRzLCBwYXJhbSkgIT09IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gdm9pZCgwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tuXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvW3BhcmFtXSA9IHZhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9hbGlhcyB0byBwYXRocyBhbmQgZm9yIFJlZ0V4cCBwYXR0ZXJuXG4gICAgICAgICAgICAgICAgb1tuXSA9IHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG8ucmVxdWVzdF8gPSBzaG91bGRUeXBlY2FzdD8gdHlwZWNhc3RWYWx1ZShyZXF1ZXN0KSA6IHJlcXVlc3Q7XG4gICAgICAgICAgICBvLnZhbHNfID0gdmFsdWVzO1xuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFBhcmFtc0FycmF5IDogZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICAgIHZhciBub3JtID0gdGhpcy5ydWxlcz8gdGhpcy5ydWxlcy5ub3JtYWxpemVfIDogbnVsbCxcbiAgICAgICAgICAgICAgICBwYXJhbXM7XG4gICAgICAgICAgICBub3JtID0gbm9ybSB8fCB0aGlzLl9yb3V0ZXIubm9ybWFsaXplRm47IC8vIGRlZmF1bHQgbm9ybWFsaXplXG4gICAgICAgICAgICBpZiAobm9ybSAmJiBpc0Z1bmN0aW9uKG5vcm0pKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gbm9ybShyZXF1ZXN0LCB0aGlzLl9nZXRQYXJhbXNPYmplY3QocmVxdWVzdCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB0aGlzLl9nZXRQYXJhbXNPYmplY3QocmVxdWVzdCkudmFsc187XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIGludGVycG9sYXRlIDogZnVuY3Rpb24ocmVwbGFjZW1lbnRzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gdGhpcy5fcm91dGVyLnBhdHRlcm5MZXhlci5pbnRlcnBvbGF0ZSh0aGlzLl9wYXR0ZXJuLCByZXBsYWNlbWVudHMpO1xuICAgICAgICAgICAgaWYgKCEgdGhpcy5fdmFsaWRhdGVQYXJhbXMoc3RyKSApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dlbmVyYXRlZCBzdHJpbmcgZG9lc25cXCd0IHZhbGlkYXRlIGFnYWluc3QgYFJvdXRlLnJ1bGVzYC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGlzcG9zZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3JvdXRlci5yZW1vdmVSb3V0ZSh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZGVzdHJveSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLnN3aXRjaGVkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlZCA9IHRoaXMuc3dpdGNoZWQgPSB0aGlzLl9wYXR0ZXJuID0gdGhpcy5fbWF0Y2hSZWdleHAgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbUm91dGUgcGF0dGVybjpcIicrIHRoaXMuX3BhdHRlcm4gKydcIiwgbnVtTGlzdGVuZXJzOicrIHRoaXMubWF0Y2hlZC5nZXROdW1MaXN0ZW5lcnMoKSArJ10nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG5cblxuICAgIC8vIFBhdHRlcm4gTGV4ZXIgLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT1cblxuICAgIENyb3Nzcm9hZHMucHJvdG90eXBlLnBhdHRlcm5MZXhlciA9IChmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyXG4gICAgICAgICAgICAvL21hdGNoIGNoYXJzIHRoYXQgc2hvdWxkIGJlIGVzY2FwZWQgb24gc3RyaW5nIHJlZ2V4cFxuICAgICAgICAgICAgRVNDQVBFX0NIQVJTX1JFR0VYUCA9IC9bXFxcXC4rKj9cXF4kXFxbXFxdKCl7fVxcLycjXS9nLFxuXG4gICAgICAgICAgICAvL3RyYWlsaW5nIHNsYXNoZXMgKGJlZ2luL2VuZCBvZiBzdHJpbmcpXG4gICAgICAgICAgICBMT09TRV9TTEFTSEVTX1JFR0VYUCA9IC9eXFwvfFxcLyQvZyxcbiAgICAgICAgICAgIExFR0FDWV9TTEFTSEVTX1JFR0VYUCA9IC9cXC8kL2csXG5cbiAgICAgICAgICAgIC8vcGFyYW1zIC0gZXZlcnl0aGluZyBiZXR3ZWVuIGB7IH1gIG9yIGA6IDpgXG4gICAgICAgICAgICBQQVJBTVNfUkVHRVhQID0gLyg/Olxce3w6KShbXn06XSspKD86XFx9fDopL2csXG5cbiAgICAgICAgICAgIC8vdXNlZCB0byBzYXZlIHBhcmFtcyBkdXJpbmcgY29tcGlsZSAoYXZvaWQgZXNjYXBpbmcgdGhpbmdzIHRoYXRcbiAgICAgICAgICAgIC8vc2hvdWxkbid0IGJlIGVzY2FwZWQpLlxuICAgICAgICAgICAgVE9LRU5TID0ge1xuICAgICAgICAgICAgICAgICdPUycgOiB7XG4gICAgICAgICAgICAgICAgICAgIC8vb3B0aW9uYWwgc2xhc2hlc1xuICAgICAgICAgICAgICAgICAgICAvL3NsYXNoIGJldHdlZW4gYDo6YCBvciBgfTpgIG9yIGBcXHc6YCBvciBgOns/YCBvciBgfXs/YCBvciBgXFx3ez9gXG4gICAgICAgICAgICAgICAgICAgIHJneCA6IC8oWzp9XXxcXHcoPz1cXC8pKVxcLz8oOnwoPzpcXHtcXD8pKS9nLFxuICAgICAgICAgICAgICAgICAgICBzYXZlIDogJyQxe3tpZH19JDInLFxuICAgICAgICAgICAgICAgICAgICByZXMgOiAnXFxcXC8/J1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ1JTJyA6IHtcbiAgICAgICAgICAgICAgICAgICAgLy9yZXF1aXJlZCBzbGFzaGVzXG4gICAgICAgICAgICAgICAgICAgIC8vdXNlZCB0byBpbnNlcnQgc2xhc2ggYmV0d2VlbiBgOntgIGFuZCBgfXtgXG4gICAgICAgICAgICAgICAgICAgIHJneCA6IC8oWzp9XSlcXC8/KFxceykvZyxcbiAgICAgICAgICAgICAgICAgICAgc2F2ZSA6ICckMXt7aWR9fSQyJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzIDogJ1xcXFwvJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ1JRJyA6IHtcbiAgICAgICAgICAgICAgICAgICAgLy9yZXF1aXJlZCBxdWVyeSBzdHJpbmcgLSBldmVyeXRoaW5nIGluIGJldHdlZW4gYHs/IH1gXG4gICAgICAgICAgICAgICAgICAgIHJneCA6IC9cXHtcXD8oW159XSspXFx9L2csXG4gICAgICAgICAgICAgICAgICAgIC8vZXZlcnl0aGluZyBmcm9tIGA/YCB0aWxsIGAjYCBvciBlbmQgb2Ygc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHJlcyA6ICdcXFxcPyhbXiNdKyknXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnT1EnIDoge1xuICAgICAgICAgICAgICAgICAgICAvL29wdGlvbmFsIHF1ZXJ5IHN0cmluZyAtIGV2ZXJ5dGhpbmcgaW4gYmV0d2VlbiBgOj8gOmBcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogLzpcXD8oW146XSspOi9nLFxuICAgICAgICAgICAgICAgICAgICAvL2V2ZXJ5dGhpbmcgZnJvbSBgP2AgdGlsbCBgI2Agb3IgZW5kIG9mIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICByZXMgOiAnKD86XFxcXD8oW14jXSopKT8nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnT1InIDoge1xuICAgICAgICAgICAgICAgICAgICAvL29wdGlvbmFsIHJlc3QgLSBldmVyeXRoaW5nIGluIGJldHdlZW4gYDogKjpgXG4gICAgICAgICAgICAgICAgICAgIHJneCA6IC86KFteOl0rKVxcKjovZyxcbiAgICAgICAgICAgICAgICAgICAgcmVzIDogJyguKik/JyAvLyBvcHRpb25hbCBncm91cCB0byBhdm9pZCBwYXNzaW5nIGVtcHR5IHN0cmluZyBhcyBjYXB0dXJlZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ1JSJyA6IHtcbiAgICAgICAgICAgICAgICAgICAgLy9yZXN0IHBhcmFtIC0gZXZlcnl0aGluZyBpbiBiZXR3ZWVuIGB7ICp9YFxuICAgICAgICAgICAgICAgICAgICByZ3ggOiAvXFx7KFtefV0rKVxcKlxcfS9nLFxuICAgICAgICAgICAgICAgICAgICByZXMgOiAnKC4rKSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8vIHJlcXVpcmVkL29wdGlvbmFsIHBhcmFtcyBzaG91bGQgY29tZSBhZnRlciByZXN0IHNlZ21lbnRzXG4gICAgICAgICAgICAgICAgJ1JQJyA6IHtcbiAgICAgICAgICAgICAgICAgICAgLy9yZXF1aXJlZCBwYXJhbXMgLSBldmVyeXRoaW5nIGJldHdlZW4gYHsgfWBcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogL1xceyhbXn1dKylcXH0vZyxcbiAgICAgICAgICAgICAgICAgICAgcmVzIDogJyhbXlxcXFwvP10rKSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdPUCcgOiB7XG4gICAgICAgICAgICAgICAgICAgIC8vb3B0aW9uYWwgcGFyYW1zIC0gZXZlcnl0aGluZyBiZXR3ZWVuIGA6IDpgXG4gICAgICAgICAgICAgICAgICAgIHJneCA6IC86KFteOl0rKTovZyxcbiAgICAgICAgICAgICAgICAgICAgcmVzIDogJyhbXlxcXFwvP10rKT9cXC8/J1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIExPT1NFX1NMQVNIID0gMSxcbiAgICAgICAgICAgIFNUUklDVF9TTEFTSCA9IDIsXG4gICAgICAgICAgICBMRUdBQ1lfU0xBU0ggPSAzLFxuXG4gICAgICAgICAgICBfc2xhc2hNb2RlID0gTE9PU0VfU0xBU0g7XG5cblxuICAgICAgICBmdW5jdGlvbiBwcmVjb21waWxlVG9rZW5zKCl7XG4gICAgICAgICAgICB2YXIga2V5LCBjdXI7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBUT0tFTlMpIHtcbiAgICAgICAgICAgICAgICBpZiAoVE9LRU5TLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyID0gVE9LRU5TW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGN1ci5pZCA9ICdfX0NSXycrIGtleSArJ19fJztcbiAgICAgICAgICAgICAgICAgICAgY3VyLnNhdmUgPSAoJ3NhdmUnIGluIGN1cik/IGN1ci5zYXZlLnJlcGxhY2UoJ3t7aWR9fScsIGN1ci5pZCkgOiBjdXIuaWQ7XG4gICAgICAgICAgICAgICAgICAgIGN1ci5yUmVzdG9yZSA9IG5ldyBSZWdFeHAoY3VyLmlkLCAnZycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwcmVjb21waWxlVG9rZW5zKCk7XG5cblxuICAgICAgICBmdW5jdGlvbiBjYXB0dXJlVmFscyhyZWdleCwgcGF0dGVybikge1xuICAgICAgICAgICAgdmFyIHZhbHMgPSBbXSwgbWF0Y2g7XG4gICAgICAgICAgICAvLyB2ZXJ5IGltcG9ydGFudCB0byByZXNldCBsYXN0SW5kZXggc2luY2UgUmVnRXhwIGNhbiBoYXZlIFwiZ1wiIGZsYWdcbiAgICAgICAgICAgIC8vIGFuZCBtdWx0aXBsZSBydW5zIG1pZ2h0IGFmZmVjdCB0aGUgcmVzdWx0LCBzcGVjaWFsbHkgaWYgbWF0Y2hpbmdcbiAgICAgICAgICAgIC8vIHNhbWUgc3RyaW5nIG11bHRpcGxlIHRpbWVzIG9uIElFIDctOFxuICAgICAgICAgICAgcmVnZXgubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChtYXRjaCA9IHJlZ2V4LmV4ZWMocGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICB2YWxzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRQYXJhbUlkcyhwYXR0ZXJuKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FwdHVyZVZhbHMoUEFSQU1TX1JFR0VYUCwgcGF0dGVybik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRPcHRpb25hbFBhcmFtc0lkcyhwYXR0ZXJuKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FwdHVyZVZhbHMoVE9LRU5TLk9QLnJneCwgcGF0dGVybik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21waWxlUGF0dGVybihwYXR0ZXJuLCBpZ25vcmVDYXNlKSB7XG4gICAgICAgICAgICBwYXR0ZXJuID0gcGF0dGVybiB8fCAnJztcblxuICAgICAgICAgICAgaWYocGF0dGVybil7XG4gICAgICAgICAgICAgICAgaWYgKF9zbGFzaE1vZGUgPT09IExPT1NFX1NMQVNIKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoTE9PU0VfU0xBU0hFU19SRUdFWFAsICcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoX3NsYXNoTW9kZSA9PT0gTEVHQUNZX1NMQVNIKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoTEVHQUNZX1NMQVNIRVNfUkVHRVhQLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9zYXZlIHRva2Vuc1xuICAgICAgICAgICAgICAgIHBhdHRlcm4gPSByZXBsYWNlVG9rZW5zKHBhdHRlcm4sICdyZ3gnLCAnc2F2ZScpO1xuICAgICAgICAgICAgICAgIC8vcmVnZXhwIGVzY2FwZVxuICAgICAgICAgICAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoRVNDQVBFX0NIQVJTX1JFR0VYUCwgJ1xcXFwkJicpO1xuICAgICAgICAgICAgICAgIC8vcmVzdG9yZSB0b2tlbnNcbiAgICAgICAgICAgICAgICBwYXR0ZXJuID0gcmVwbGFjZVRva2VucyhwYXR0ZXJuLCAnclJlc3RvcmUnLCAncmVzJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoX3NsYXNoTW9kZSA9PT0gTE9PU0VfU0xBU0gpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybiA9ICdcXFxcLz8nKyBwYXR0ZXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9zbGFzaE1vZGUgIT09IFNUUklDVF9TTEFTSCkge1xuICAgICAgICAgICAgICAgIC8vc2luZ2xlIHNsYXNoIGlzIHRyZWF0ZWQgYXMgZW1wdHkgYW5kIGVuZCBzbGFzaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgICAgIHBhdHRlcm4gKz0gJ1xcXFwvPyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cCgnXicrIHBhdHRlcm4gKyAnJCcsIGlnbm9yZUNhc2U/ICdpJyA6ICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VUb2tlbnMocGF0dGVybiwgcmVnZXhwTmFtZSwgcmVwbGFjZU5hbWUpIHtcbiAgICAgICAgICAgIHZhciBjdXIsIGtleTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIFRPS0VOUykge1xuICAgICAgICAgICAgICAgIGlmIChUT0tFTlMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjdXIgPSBUT0tFTlNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShjdXJbcmVnZXhwTmFtZV0sIGN1cltyZXBsYWNlTmFtZV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0UGFyYW1WYWx1ZXMocmVxdWVzdCwgcmVnZXhwLCBzaG91bGRUeXBlY2FzdCkge1xuICAgICAgICAgICAgdmFyIHZhbHMgPSByZWdleHAuZXhlYyhyZXF1ZXN0KTtcbiAgICAgICAgICAgIGlmICh2YWxzKSB7XG4gICAgICAgICAgICAgICAgdmFscy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRUeXBlY2FzdCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxzID0gdHlwZWNhc3RBcnJheVZhbHVlcyh2YWxzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFscztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGludGVycG9sYXRlKHBhdHRlcm4sIHJlcGxhY2VtZW50cykge1xuICAgICAgICAgICAgLy8gZGVmYXVsdCB0byBhbiBlbXB0eSBvYmplY3QgYmVjYXVzZSBwYXR0ZXJuIG1pZ2h0IGhhdmUganVzdFxuICAgICAgICAgICAgLy8gb3B0aW9uYWwgYXJndW1lbnRzXG4gICAgICAgICAgICByZXBsYWNlbWVudHMgPSByZXBsYWNlbWVudHMgfHwge307XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhdHRlcm4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSb3V0ZSBwYXR0ZXJuIHNob3VsZCBiZSBhIHN0cmluZy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJlcGxhY2VGbiA9IGZ1bmN0aW9uKG1hdGNoLCBwcm9wKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcHJvcCA9IChwcm9wLnN1YnN0cigwLCAxKSA9PT0gJz8nKT8gcHJvcC5zdWJzdHIoMSkgOiBwcm9wO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnRzW3Byb3BdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnRzW3Byb3BdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeVBhcnRzID0gW10sIHJlcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGtleSBpbiByZXBsYWNlbWVudHNbcHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwID0gcmVwbGFjZW1lbnRzW3Byb3BdW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHJlcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gcmVwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBrZXkuc2xpY2UoLTIpID09ICdbXScgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5UGFydHMucHVzaChlbmNvZGVVUkkoa2V5LnNsaWNlKDAsIC0yKSkgKyAnW109JyArIGVuY29kZVVSSShyZXBba10pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeVBhcnRzLnB1c2goZW5jb2RlVVJJKGtleSArICc9JyArIHJlcFtrXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5UGFydHMucHVzaChlbmNvZGVVUkkoa2V5ICsgJz0nICsgcmVwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gJz8nICsgcXVlcnlQYXJ0cy5qb2luKCcmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB2YWx1ZSBpcyBhIHN0cmluZyBzZWUgI2doLTU0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gU3RyaW5nKHJlcGxhY2VtZW50c1twcm9wXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaC5pbmRleE9mKCcqJykgPT09IC0xICYmIHZhbC5pbmRleE9mKCcvJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlIFwiJysgdmFsICsnXCIgZm9yIHNlZ21lbnQgXCInKyBtYXRjaCArJ1wiLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1hdGNoLmluZGV4T2YoJ3snKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNlZ21lbnQgJysgbWF0Y2ggKycgaXMgcmVxdWlyZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghIFRPS0VOUy5PUy50cmFpbCkge1xuICAgICAgICAgICAgICAgIFRPS0VOUy5PUy50cmFpbCA9IG5ldyBSZWdFeHAoJyg/OicrIFRPS0VOUy5PUy5pZCArJykrJCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGF0dGVyblxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoVE9LRU5TLk9TLnJneCwgVE9LRU5TLk9TLnNhdmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShQQVJBTVNfUkVHRVhQLCByZXBsYWNlRm4pXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShUT0tFTlMuT1MudHJhaWwsICcnKSAvLyByZW1vdmUgdHJhaWxpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKFRPS0VOUy5PUy5yUmVzdG9yZSwgJy8nKTsgLy8gYWRkIHNsYXNoIGJldHdlZW4gc2VnbWVudHNcbiAgICAgICAgfVxuXG4gICAgICAgIC8vQVBJXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdHJpY3QgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIF9zbGFzaE1vZGUgPSBTVFJJQ1RfU0xBU0g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9vc2UgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIF9zbGFzaE1vZGUgPSBMT09TRV9TTEFTSDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZWdhY3kgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIF9zbGFzaE1vZGUgPSBMRUdBQ1lfU0xBU0g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UGFyYW1JZHMgOiBnZXRQYXJhbUlkcyxcbiAgICAgICAgICAgIGdldE9wdGlvbmFsUGFyYW1zSWRzIDogZ2V0T3B0aW9uYWxQYXJhbXNJZHMsXG4gICAgICAgICAgICBnZXRQYXJhbVZhbHVlcyA6IGdldFBhcmFtVmFsdWVzLFxuICAgICAgICAgICAgY29tcGlsZVBhdHRlcm4gOiBjb21waWxlUGF0dGVybixcbiAgICAgICAgICAgIGludGVycG9sYXRlIDogaW50ZXJwb2xhdGVcbiAgICAgICAgfTtcblxuICAgIH0oKSk7XG5cblxuICAgIHJldHVybiBjcm9zc3JvYWRzO1xufTtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJ3NpZ25hbHMnXSwgZmFjdG9yeSk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vTm9kZVxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdzaWduYWxzJykpO1xufSBlbHNlIHtcbiAgICAvKmpzaGludCBzdWI6dHJ1ZSAqL1xuICAgIHdpbmRvd1snY3Jvc3Nyb2FkcyddID0gZmFjdG9yeSh3aW5kb3dbJ3NpZ25hbHMnXSk7XG59XG5cbn0oKSk7XG5cbiIsImZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gIGEuX3N1cGVyID0gYlxuICBmb3IodmFyIGtleSBpbiBiKSB7XG4gICAgaWYoYi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBhW2tleV0gPSBiW2tleV07XG4gICAgfVxuICAgIC8vIERvZXMgdGhlIHByb3BlcnR5IGhhdmUgYSBjdXN0b20gZ2V0dGVyIG9yIHNldHRlcj9cbiAgICBpZiAodHlwZW9mIGIuX19sb29rdXBHZXR0ZXJfXyhrZXkpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gY29uc29sZS5sb2coJ2ZvdW5kIGEgZ2V0dGVyIGZvciAnICsga2V5KTtcbiAgICAgIGEuX19kZWZpbmVHZXR0ZXJfXyhrZXksIGIuX19sb29rdXBHZXR0ZXJfXyhrZXkpKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGIuX19sb29rdXBTZXR0ZXJfXyhrZXkpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gY29uc29sZS5sb2coJ2ZvdW5kIGEgc2V0dGVyIGZvciAnICsga2V5KTtcbiAgICAgIGEuX19kZWZpbmVTZXR0ZXJfXyhrZXksIGIuX19sb29rdXBTZXR0ZXJfXyhrZXkpKVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIGE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xuIiwid2luZG93LnNlbnNpYmxlID0gdHlwZW9mIHNlbnNpYmxlICE9PSBcInVuZGVmaW5lZFwiID8gc2Vuc2libGUgOiB7fTtcbnNlbnNpYmxlLmNsYXNzZXMgPSB0eXBlb2Ygc2Vuc2libGUuY2xhc3NlcyAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbnNpYmxlLmNsYXNzZXMgOiB7fTtcblxuc2Vuc2libGUuY2xhc3Nlcy5Db21wb25lbnQgPSByZXF1aXJlKCcuL2pzL3NlbnNpYmxlQ29tcG9uZW50LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2Vuc2libGUuY2xhc3Nlcy5Db21wb25lbnQ7XG4iLCJ2YXIgQ29tcG9uZW50ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG5cdC8vIFVzZSB0aGUgcHJpdmF0ZSBtZW1iZXJzIGZvciBjdXN0b20gaGlkZGVuIHNldHRlcnMgYW5kIGdldHRlcnMuXG5cdC8vIEFuIGlkZW50aWZpZXIgZm9yIHRoZSBjb21wb25lbnQncyBjdXJyZW50IHN0YXRlLlxuXHR2YXIgc3RhdGUgPSAnJztcblx0Ly8gVGhlIGVsZW1lbnQgdG8gd2hpY2ggdGhpcyBjb21wb25lbnQgKGVsKSBzaG91bGQgYmUgcmVuZGVyZWQvYXBwZW5kZWQgdG8uXG5cdHZhciB0YXJnZXQgPSB1bmRlZmluZWQ7XG5cblx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdC8vIFRvIGxvZyBvciBub3QgdG8gbG9nLi5cblx0XHRkZWJ1ZzogZmFsc2UsXG5cdFx0ZWwgOiAkKGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSksXG5cdFx0c3RhdGVDaGFuZ2UgOiBmdW5jdGlvbihvbGRTdGF0ZSwgbmV3U3RhdGUpIHtcblx0XHRcdHNlbGYubG9nKCdDaGFuZ2luZyBzdGF0ZSBmcm9tICcgKyBvbGRTdGF0ZSArICcgdG8gJyArIG5ld1N0YXRlKTtcblx0XHR9LFxuXHRcdHByZWxvYWQ6IGZ1bmN0aW9uKCkgeyB9LFxuXHRcdHBvc3Rsb2FkOiBmdW5jdGlvbigpIHsgfSxcblx0XHRzdGF0ZVByZXByb2Nlc3M6IGZ1bmN0aW9uKHN0YXRlKSB7XG5cdFx0XHRyZXR1cm4gc3RhdGU7XG5cdFx0fSxcblx0XHQvLyBUbyBhdm9pZCBjb2xsaXNpb25zIGFuZCBpbmNhc2UgeW91IHdhbnQgdG8gbmFtZXNwYWNlIGluZGl2aWR1YWwgY29tcG9uZW50c1xuXHRcdGV2ZW50TmFtZXNwYWNlOiAnc2Vuc2libGUnLFxuXHRcdC8vIENhbGwgcmVuZGVyIGF1dG9tYXRpY2FsbHkgdXBvbiBjb25zdHJ1Y3Rpb24gYmVjdXNlIHNvbWV0aW1lcyB5b3UganVzdCB3YW50IHRvIGNvbnN0cnVjdCB0aGUgdGhpbmcuIERpc2FibGUgaWYgdGhlIGNvbXBvbmVudCByZXF1ZXN0IGRhdGEgYXN5bmMgYW5kIHNob3VsZCBub3QgYmUgc2hvdyB1bnRpbCBpdCBpcyBsb2FkZWQuXG5cdFx0YXV0b1JlbmRlcjogdHJ1ZSxcblx0fTtcblxuXHQvLyBTdXBwbHkgYSBkZWZhdWx0IHRhcmdldCBvbmx5IGFzIGEgbGFzdCByZXNvcnQuIFRoaXMgd2F5IHRoZSBib2R5IGlzbid0IHNlbGVjdGVkIGV2ZXJ5IHRpbWUuXG5cdGlmICh0eXBlb2YgJGNvbnRlbnRUYXJnZXQgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRkZWZhdWx0cy50YXJnZXQgPSAkY29udGVudFRhcmdldDtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2Ygb3B0aW9ucy50YXJnZXQgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHR0YXJnZXQgPSBvcHRpb25zLnRhcmdldFxuXHR9XG5cdGVsc2Uge1xuXHRcdHRhcmdldCA9ICQoZG9jdW1lbnQuYm9keSk7XG5cdH1cblxuXHR0aGlzLmxvZyA9IGZ1bmN0aW9uKG1zZykge1xuXHRcdGlmIChzZWxmLmRlYnVnKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhtc2cpO1xuXHRcdH1cblx0fVxuXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAndGFyZ2V0Jywge1xuXHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGFyZ2V0O1xuXHRcdH0sXG5cdFx0c2V0OiBmdW5jdGlvbihhcmcpIHtcblx0XHRcdC8vIElmIHRoZSBhcmd1bWVudCBpcyBhIHN0cmluZywgaXQgaXMgYSBzZWxlY3RvciBjb252ZXJ0IGl0IHRvIGEgalF1ZXJ5IG9iamVjdFxuXHRcdFx0aWYgKHR5cGVvZiBhcmcgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0dGFyZ2V0ID0gJChhcmcpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgalF1ZXJ5KSB7XG5cdFx0XHRcdHRhcmdldCA9IGFyZ1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybignVW5yZWdvbml6ZWQgdGFyZ2V0IHNlbGVjdG9yLicsIGFyZyk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRlbnVtZXJhYmxlOiB0cnVlXG5cdH0pO1xuXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc3RhdGUnLCB7XG5cdFx0Z2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHN0YXRlOyB9LFxuXHRcdHNldDogZnVuY3Rpb24obmV3U3RhdGUpIHtcblx0XHRcdHZhciBvbGRTdGF0ZSA9IHN0YXRlO1xuXHRcdFx0bmV3U3RhdGUgPSB0aGlzLnN0YXRlUHJlcHJvY2VzcyhuZXdTdGF0ZSk7XG5cdFx0XHRzdGF0ZSA9IG5ld1N0YXRlO1xuXHRcdFx0dGhpcy5zdGF0ZUNoYW5nZShvbGRTdGF0ZSwgbmV3U3RhdGUpXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH0sXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZVxuXHR9KTtcblxuXHQvLyAkLmV4dGVuZCh0aGlzLCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cdHNlbGYgPSBleHRlbmQodGhpcywgZGVmYXVsdHMpXG5cdHNlbGYgPSBleHRlbmQodGhpcywgb3B0aW9ucylcblxuXHQvLyBFeHRlbmQgZG9lcyBub3QgdHJpZ2dlciBjdXN0b20gc2V0dGVycyBhbmQgZ2V0dGVycy4gVGhlcmUgYXJlIHNvbWUgcHJvcGVydGllcyB0aGF0IGlmIGRlZmluZWQgb24gaW5pdCB0aGUgY3VzdG9tIHNldHRlci9nZXR0ZXIgaXMgbm90IGNhbGxlZC4gbWFrZSB0aGUgYXNzaWdtZW50IG1hbnVhbGx5IGZvciB0aGVzZSBzZW5zaXRpdmUgcHJvcGVydGllcy5cblx0aWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdGF0ZSkge1xuXHRcdHRoaXMuc3RhdGUgPSBvcHRpb25zLnN0YXRlXG5cdH1cblxuXHR0aGlzLmdvID0gZnVuY3Rpb24obmV3U3RhdGUpIHtcblx0XHR0aGlzLnN0YXRlID0gbmV3U3RhdGU7XG5cdH1cblxuXHQvLyBBcHBlbmQgdGhlIEVsIHdpdGggYWxsIG9mIGl0cyBtYXJrdXAgYW5kIGV2ZW50cyB0byB0aGUgdGFyZ2V0RWxcblx0dGhpcy5yZW5kZXIgPSBmdW5jdGlvbigpIHtcblx0XHRzZWxmLnByZWxvYWQoKTtcblx0XHRzZWxmLmxvZygnUmVuZGVyaW5nLi4nKTtcblx0XHRzZWxmLnRhcmdldC5hcHBlbmQodGhpcy5lbCk7XG5cdFx0c2VsZi5wb3N0bG9hZCgpO1xuXHR9XG5cblx0dGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VsZi50YXJnZXQuZW1wdHkoKTtcblx0fVxuXG5cdC8vIENhbGwgcmVuZGVyIGF1dG9tYXRpY2FsbHkgdXBvbiBjb25zdHJ1Y3Rpb25cblx0aWYgKHRoaXMuYXV0b1JlbmRlcikge1xuXHRcdHRoaXMucmVuZGVyKClcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7XG4iLCIvKmpzbGludCBvbmV2YXI6dHJ1ZSwgdW5kZWY6dHJ1ZSwgbmV3Y2FwOnRydWUsIHJlZ2V4cDp0cnVlLCBiaXR3aXNlOnRydWUsIG1heGVycjo1MCwgaW5kZW50OjQsIHdoaXRlOmZhbHNlLCBub21lbjpmYWxzZSwgcGx1c3BsdXM6ZmFsc2UgKi9cbi8qZ2xvYmFsIGRlZmluZTpmYWxzZSwgcmVxdWlyZTpmYWxzZSwgZXhwb3J0czpmYWxzZSwgbW9kdWxlOmZhbHNlLCBzaWduYWxzOmZhbHNlICovXG5cbi8qKiBAbGljZW5zZVxuICogSlMgU2lnbmFscyA8aHR0cDovL21pbGxlcm1lZGVpcm9zLmdpdGh1Yi5jb20vanMtc2lnbmFscy8+XG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIEF1dGhvcjogTWlsbGVyIE1lZGVpcm9zXG4gKiBWZXJzaW9uOiAxLjAuMCAtIEJ1aWxkOiAyNjggKDIwMTIvMTEvMjkgMDU6NDggUE0pXG4gKi9cblxuKGZ1bmN0aW9uKGdsb2JhbCl7XG5cbiAgICAvLyBTaWduYWxCaW5kaW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIE9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBiaW5kaW5nIGJldHdlZW4gYSBTaWduYWwgYW5kIGEgbGlzdGVuZXIgZnVuY3Rpb24uXG4gICAgICogPGJyIC8+LSA8c3Ryb25nPlRoaXMgaXMgYW4gaW50ZXJuYWwgY29uc3RydWN0b3IgYW5kIHNob3VsZG4ndCBiZSBjYWxsZWQgYnkgcmVndWxhciB1c2Vycy48L3N0cm9uZz5cbiAgICAgKiA8YnIgLz4tIGluc3BpcmVkIGJ5IEpvYSBFYmVydCBBUzMgU2lnbmFsQmluZGluZyBhbmQgUm9iZXJ0IFBlbm5lcidzIFNsb3QgY2xhc3Nlcy5cbiAgICAgKiBAYXV0aG9yIE1pbGxlciBNZWRlaXJvc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBuYW1lIFNpZ25hbEJpbmRpbmdcbiAgICAgKiBAcGFyYW0ge1NpZ25hbH0gc2lnbmFsIFJlZmVyZW5jZSB0byBTaWduYWwgb2JqZWN0IHRoYXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGJvdW5kIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzT25jZSBJZiBiaW5kaW5nIHNob3VsZCBiZSBleGVjdXRlZCBqdXN0IG9uY2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV0gVGhlIHByaW9yaXR5IGxldmVsIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gKGRlZmF1bHQgPSAwKS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTaWduYWxCaW5kaW5nKHNpZ25hbCwgbGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9saXN0ZW5lciA9IGxpc3RlbmVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBiaW5kaW5nIHNob3VsZCBiZSBleGVjdXRlZCBqdXN0IG9uY2UuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2lzT25jZSA9IGlzT25jZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgICAgICogQG1lbWJlck9mIFNpZ25hbEJpbmRpbmcucHJvdG90eXBlXG4gICAgICAgICAqIEBuYW1lIGNvbnRleHRcbiAgICAgICAgICogQHR5cGUgT2JqZWN0fHVuZGVmaW5lZHxudWxsXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBsaXN0ZW5lckNvbnRleHQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZmVyZW5jZSB0byBTaWduYWwgb2JqZWN0IHRoYXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGJvdW5kIHRvLlxuICAgICAgICAgKiBAdHlwZSBTaWduYWxcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3NpZ25hbCA9IHNpZ25hbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdGVuZXIgcHJpb3JpdHlcbiAgICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9wcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG4gICAgfVxuXG4gICAgU2lnbmFsQmluZGluZy5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGJpbmRpbmcgaXMgYWN0aXZlIGFuZCBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIGFjdGl2ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgcGFyYW1ldGVycyBwYXNzZWQgdG8gbGlzdGVuZXIgZHVyaW5nIGBTaWduYWwuZGlzcGF0Y2hgIGFuZCBgU2lnbmFsQmluZGluZy5leGVjdXRlYC4gKGN1cnJpZWQgcGFyYW1ldGVycylcbiAgICAgICAgICogQHR5cGUgQXJyYXl8bnVsbFxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYW1zIDogbnVsbCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBsaXN0ZW5lciBwYXNzaW5nIGFyYml0cmFyeSBwYXJhbWV0ZXJzLlxuICAgICAgICAgKiA8cD5JZiBiaW5kaW5nIHdhcyBhZGRlZCB1c2luZyBgU2lnbmFsLmFkZE9uY2UoKWAgaXQgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgZnJvbSBzaWduYWwgZGlzcGF0Y2ggcXVldWUsIHRoaXMgbWV0aG9kIGlzIHVzZWQgaW50ZXJuYWxseSBmb3IgdGhlIHNpZ25hbCBkaXNwYXRjaC48L3A+XG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IFtwYXJhbXNBcnJdIEFycmF5IG9mIHBhcmFtZXRlcnMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lclxuICAgICAgICAgKiBAcmV0dXJuIHsqfSBWYWx1ZSByZXR1cm5lZCBieSB0aGUgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBleGVjdXRlIDogZnVuY3Rpb24gKHBhcmFtc0Fycikge1xuICAgICAgICAgICAgdmFyIGhhbmRsZXJSZXR1cm4sIHBhcmFtcztcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGl2ZSAmJiAhIXRoaXMuX2xpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gdGhpcy5wYXJhbXM/IHRoaXMucGFyYW1zLmNvbmNhdChwYXJhbXNBcnIpIDogcGFyYW1zQXJyO1xuICAgICAgICAgICAgICAgIGhhbmRsZXJSZXR1cm4gPSB0aGlzLl9saXN0ZW5lci5hcHBseSh0aGlzLmNvbnRleHQsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2lzT25jZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFjaCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyUmV0dXJuO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXRhY2ggYmluZGluZyBmcm9tIHNpZ25hbC5cbiAgICAgICAgICogLSBhbGlhcyB0bzogbXlTaWduYWwucmVtb3ZlKG15QmluZGluZy5nZXRMaXN0ZW5lcigpKTtcbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb258bnVsbH0gSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsIG9yIGBudWxsYCBpZiBiaW5kaW5nIHdhcyBwcmV2aW91c2x5IGRldGFjaGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgZGV0YWNoIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNCb3VuZCgpPyB0aGlzLl9zaWduYWwucmVtb3ZlKHRoaXMuX2xpc3RlbmVyLCB0aGlzLmNvbnRleHQpIDogbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGJpbmRpbmcgaXMgc3RpbGwgYm91bmQgdG8gdGhlIHNpZ25hbCBhbmQgaGF2ZSBhIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgaXNCb3VuZCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoISF0aGlzLl9zaWduYWwgJiYgISF0aGlzLl9saXN0ZW5lcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IElmIFNpZ25hbEJpbmRpbmcgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIG9uY2UuXG4gICAgICAgICAqL1xuICAgICAgICBpc09uY2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNPbmNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TGlzdGVuZXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGlzdGVuZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbH0gU2lnbmFsIHRoYXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGJvdW5kIHRvLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0U2lnbmFsIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NpZ25hbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVsZXRlIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9kZXN0cm95IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3NpZ25hbDtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcjtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnW1NpZ25hbEJpbmRpbmcgaXNPbmNlOicgKyB0aGlzLl9pc09uY2UgKycsIGlzQm91bmQ6JysgdGhpcy5pc0JvdW5kKCkgKycsIGFjdGl2ZTonICsgdGhpcy5hY3RpdmUgKyAnXSc7XG4gICAgICAgIH1cblxuICAgIH07XG5cblxuLypnbG9iYWwgU2lnbmFsQmluZGluZzpmYWxzZSovXG5cbiAgICAvLyBTaWduYWwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsIGZuTmFtZSkge1xuICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdsaXN0ZW5lciBpcyBhIHJlcXVpcmVkIHBhcmFtIG9mIHtmbn0oKSBhbmQgc2hvdWxkIGJlIGEgRnVuY3Rpb24uJy5yZXBsYWNlKCd7Zm59JywgZm5OYW1lKSApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGJyb2FkY2FzdGVyXG4gICAgICogPGJyIC8+LSBpbnNwaXJlZCBieSBSb2JlcnQgUGVubmVyJ3MgQVMzIFNpZ25hbHMuXG4gICAgICogQG5hbWUgU2lnbmFsXG4gICAgICogQGF1dGhvciBNaWxsZXIgTWVkZWlyb3NcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTaWduYWwoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSBBcnJheS48U2lnbmFsQmluZGluZz5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2JpbmRpbmdzID0gW107XG4gICAgICAgIHRoaXMuX3ByZXZQYXJhbXMgPSBudWxsO1xuXG4gICAgICAgIC8vIGVuZm9yY2UgZGlzcGF0Y2ggdG8gYXdheXMgd29yayBvbiBzYW1lIGNvbnRleHQgKCM0NylcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmRpc3BhdGNoID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFNpZ25hbC5wcm90b3R5cGUuZGlzcGF0Y2guYXBwbHkoc2VsZiwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBTaWduYWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaWduYWxzIFZlcnNpb24gTnVtYmVyXG4gICAgICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAgICAgKiBAY29uc3RcbiAgICAgICAgICovXG4gICAgICAgIFZFUlNJT04gOiAnMS4wLjAnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBTaWduYWwgc2hvdWxkIGtlZXAgcmVjb3JkIG9mIHByZXZpb3VzbHkgZGlzcGF0Y2hlZCBwYXJhbWV0ZXJzIGFuZFxuICAgICAgICAgKiBhdXRvbWF0aWNhbGx5IGV4ZWN1dGUgbGlzdGVuZXIgZHVyaW5nIGBhZGQoKWAvYGFkZE9uY2UoKWAgaWYgU2lnbmFsIHdhc1xuICAgICAgICAgKiBhbHJlYWR5IGRpc3BhdGNoZWQgYmVmb3JlLlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBtZW1vcml6ZSA6IGZhbHNlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfc2hvdWxkUHJvcGFnYXRlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgU2lnbmFsIGlzIGFjdGl2ZSBhbmQgc2hvdWxkIGJyb2FkY2FzdCBldmVudHMuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgZHVyaW5nIGEgZGlzcGF0Y2ggd2lsbCBvbmx5IGFmZmVjdCB0aGUgbmV4dCBkaXNwYXRjaCwgaWYgeW91IHdhbnQgdG8gc3RvcCB0aGUgcHJvcGFnYXRpb24gb2YgYSBzaWduYWwgdXNlIGBoYWx0KClgIGluc3RlYWQuPC9wPlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBhY3RpdmUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzT25jZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF1cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV1cbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9yZWdpc3Rlckxpc3RlbmVyIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcblxuICAgICAgICAgICAgdmFyIHByZXZJbmRleCA9IHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lciwgbGlzdGVuZXJDb250ZXh0KSxcbiAgICAgICAgICAgICAgICBiaW5kaW5nO1xuXG4gICAgICAgICAgICBpZiAocHJldkluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGJpbmRpbmcgPSB0aGlzLl9iaW5kaW5nc1twcmV2SW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nLmlzT25jZSgpICE9PSBpc09uY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2Fubm90IGFkZCcrIChpc09uY2U/ICcnIDogJ09uY2UnKSArJygpIHRoZW4gYWRkJysgKCFpc09uY2U/ICcnIDogJ09uY2UnKSArJygpIHRoZSBzYW1lIGxpc3RlbmVyIHdpdGhvdXQgcmVtb3ZpbmcgdGhlIHJlbGF0aW9uc2hpcCBmaXJzdC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJpbmRpbmcgPSBuZXcgU2lnbmFsQmluZGluZyh0aGlzLCBsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRCaW5kaW5nKGJpbmRpbmcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0aGlzLm1lbW9yaXplICYmIHRoaXMuX3ByZXZQYXJhbXMpe1xuICAgICAgICAgICAgICAgIGJpbmRpbmcuZXhlY3V0ZSh0aGlzLl9wcmV2UGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7U2lnbmFsQmluZGluZ30gYmluZGluZ1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2FkZEJpbmRpbmcgOiBmdW5jdGlvbiAoYmluZGluZykge1xuICAgICAgICAgICAgLy9zaW1wbGlmaWVkIGluc2VydGlvbiBzb3J0XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgICAgIGRvIHsgLS1uOyB9IHdoaWxlICh0aGlzLl9iaW5kaW5nc1tuXSAmJiBiaW5kaW5nLl9wcmlvcml0eSA8PSB0aGlzLl9iaW5kaW5nc1tuXS5fcHJpb3JpdHkpO1xuICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Muc3BsaWNlKG4gKyAxLCAwLCBiaW5kaW5nKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2luZGV4T2ZMaXN0ZW5lciA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgY3VyO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIGN1ciA9IHRoaXMuX2JpbmRpbmdzW25dO1xuICAgICAgICAgICAgICAgIGlmIChjdXIuX2xpc3RlbmVyID09PSBsaXN0ZW5lciAmJiBjdXIuY29udGV4dCA9PT0gY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrIGlmIGxpc3RlbmVyIHdhcyBhdHRhY2hlZCB0byBTaWduYWwuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gaWYgU2lnbmFsIGhhcyB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgaGFzIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBjb250ZXh0KSAhPT0gLTE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBhIGxpc3RlbmVyIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFNpZ25hbCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV0gVGhlIHByaW9yaXR5IGxldmVsIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gTGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgZXhlY3V0ZWQgYmVmb3JlIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5LiBMaXN0ZW5lcnMgd2l0aCBzYW1lIHByaW9yaXR5IGxldmVsIHdpbGwgYmUgZXhlY3V0ZWQgYXQgdGhlIHNhbWUgb3JkZXIgYXMgdGhleSB3ZXJlIGFkZGVkLiAoZGVmYXVsdCA9IDApXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbEJpbmRpbmd9IEFuIE9iamVjdCByZXByZXNlbnRpbmcgdGhlIGJpbmRpbmcgYmV0d2VlbiB0aGUgU2lnbmFsIGFuZCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuICAgICAgICAgICAgdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgJ2FkZCcpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXIobGlzdGVuZXIsIGZhbHNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGxpc3RlbmVyIHRvIHRoZSBzaWduYWwgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZCBhZnRlciBmaXJzdCBleGVjdXRpb24gKHdpbGwgYmUgZXhlY3V0ZWQgb25seSBvbmNlKS5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgU2lnbmFsIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiBMaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBleGVjdXRlZCBiZWZvcmUgbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkuIExpc3RlbmVycyB3aXRoIHNhbWUgcHJpb3JpdHkgbGV2ZWwgd2lsbCBiZSBleGVjdXRlZCBhdCB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgYWRkZWQuIChkZWZhdWx0ID0gMClcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ30gQW4gT2JqZWN0IHJlcHJlc2VudGluZyB0aGUgYmluZGluZyBiZXR3ZWVuIHRoZSBTaWduYWwgYW5kIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgYWRkT25jZSA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuICAgICAgICAgICAgdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgJ2FkZE9uY2UnKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3Rlckxpc3RlbmVyKGxpc3RlbmVyLCB0cnVlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGEgc2luZ2xlIGxpc3RlbmVyIGZyb20gdGhlIGRpc3BhdGNoIHF1ZXVlLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBIYW5kbGVyIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gRXhlY3V0aW9uIGNvbnRleHQgKHNpbmNlIHlvdSBjYW4gYWRkIHRoZSBzYW1lIGhhbmRsZXIgbXVsdGlwbGUgdGltZXMgaWYgZXhlY3V0aW5nIGluIGEgZGlmZmVyZW50IGNvbnRleHQpLlxuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTGlzdGVuZXIgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZSA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgY29udGV4dCkge1xuICAgICAgICAgICAgdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgJ3JlbW92ZScpO1xuXG4gICAgICAgICAgICB2YXIgaSA9IHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lciwgY29udGV4dCk7XG4gICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iaW5kaW5nc1tpXS5fZGVzdHJveSgpOyAvL25vIHJlYXNvbiB0byBhIFNpZ25hbEJpbmRpbmcgZXhpc3QgaWYgaXQgaXNuJ3QgYXR0YWNoZWQgdG8gYSBzaWduYWxcbiAgICAgICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZyb20gdGhlIFNpZ25hbC5cbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZUFsbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzW25dLl9kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5sZW5ndGggPSAwO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IE51bWJlciBvZiBsaXN0ZW5lcnMgYXR0YWNoZWQgdG8gdGhlIFNpZ25hbC5cbiAgICAgICAgICovXG4gICAgICAgIGdldE51bUxpc3RlbmVycyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3AgcHJvcGFnYXRpb24gb2YgdGhlIGV2ZW50LCBibG9ja2luZyB0aGUgZGlzcGF0Y2ggdG8gbmV4dCBsaXN0ZW5lcnMgb24gdGhlIHF1ZXVlLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gc2hvdWxkIGJlIGNhbGxlZCBvbmx5IGR1cmluZyBzaWduYWwgZGlzcGF0Y2gsIGNhbGxpbmcgaXQgYmVmb3JlL2FmdGVyIGRpc3BhdGNoIHdvbid0IGFmZmVjdCBzaWduYWwgYnJvYWRjYXN0LjwvcD5cbiAgICAgICAgICogQHNlZSBTaWduYWwucHJvdG90eXBlLmRpc2FibGVcbiAgICAgICAgICovXG4gICAgICAgIGhhbHQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG91bGRQcm9wYWdhdGUgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2gvQnJvYWRjYXN0IFNpZ25hbCB0byBhbGwgbGlzdGVuZXJzIGFkZGVkIHRvIHRoZSBxdWV1ZS5cbiAgICAgICAgICogQHBhcmFtIHsuLi4qfSBbcGFyYW1zXSBQYXJhbWV0ZXJzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCB0byBlYWNoIGhhbmRsZXIuXG4gICAgICAgICAqL1xuICAgICAgICBkaXNwYXRjaCA6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmICghIHRoaXMuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcGFyYW1zQXJyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgICAgICBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGJpbmRpbmdzO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5tZW1vcml6ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXZQYXJhbXMgPSBwYXJhbXNBcnI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghIG4pIHtcbiAgICAgICAgICAgICAgICAvL3Nob3VsZCBjb21lIGFmdGVyIG1lbW9yaXplXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBiaW5kaW5ncyA9IHRoaXMuX2JpbmRpbmdzLnNsaWNlKCk7IC8vY2xvbmUgYXJyYXkgaW4gY2FzZSBhZGQvcmVtb3ZlIGl0ZW1zIGR1cmluZyBkaXNwYXRjaFxuICAgICAgICAgICAgdGhpcy5fc2hvdWxkUHJvcGFnYXRlID0gdHJ1ZTsgLy9pbiBjYXNlIGBoYWx0YCB3YXMgY2FsbGVkIGJlZm9yZSBkaXNwYXRjaCBvciBkdXJpbmcgdGhlIHByZXZpb3VzIGRpc3BhdGNoLlxuXG4gICAgICAgICAgICAvL2V4ZWN1dGUgYWxsIGNhbGxiYWNrcyB1bnRpbCBlbmQgb2YgdGhlIGxpc3Qgb3IgdW50aWwgYSBjYWxsYmFjayByZXR1cm5zIGBmYWxzZWAgb3Igc3RvcHMgcHJvcGFnYXRpb25cbiAgICAgICAgICAgIC8vcmV2ZXJzZSBsb29wIHNpbmNlIGxpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGFkZGVkIGF0IHRoZSBlbmQgb2YgdGhlIGxpc3RcbiAgICAgICAgICAgIGRvIHsgbi0tOyB9IHdoaWxlIChiaW5kaW5nc1tuXSAmJiB0aGlzLl9zaG91bGRQcm9wYWdhdGUgJiYgYmluZGluZ3Nbbl0uZXhlY3V0ZShwYXJhbXNBcnIpICE9PSBmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcmdldCBtZW1vcml6ZWQgYXJndW1lbnRzLlxuICAgICAgICAgKiBAc2VlIFNpZ25hbC5tZW1vcml6ZVxuICAgICAgICAgKi9cbiAgICAgICAgZm9yZ2V0IDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZQYXJhbXMgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIGJpbmRpbmdzIGZyb20gc2lnbmFsIGFuZCBkZXN0cm95IGFueSByZWZlcmVuY2UgdG8gZXh0ZXJuYWwgb2JqZWN0cyAoZGVzdHJveSBTaWduYWwgb2JqZWN0KS5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IGNhbGxpbmcgYW55IG1ldGhvZCBvbiB0aGUgc2lnbmFsIGluc3RhbmNlIGFmdGVyIGNhbGxpbmcgZGlzcG9zZSB3aWxsIHRocm93IGVycm9ycy48L3A+XG4gICAgICAgICAqL1xuICAgICAgICBkaXNwb3NlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9iaW5kaW5ncztcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9wcmV2UGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1tTaWduYWwgYWN0aXZlOicrIHRoaXMuYWN0aXZlICsnIG51bUxpc3RlbmVyczonKyB0aGlzLmdldE51bUxpc3RlbmVycygpICsnXSc7XG4gICAgICAgIH1cblxuICAgIH07XG5cblxuICAgIC8vIE5hbWVzcGFjZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICogU2lnbmFscyBuYW1lc3BhY2VcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG5hbWUgc2lnbmFsc1xuICAgICAqL1xuICAgIHZhciBzaWduYWxzID0gU2lnbmFsO1xuXG4gICAgLyoqXG4gICAgICogQ3VzdG9tIGV2ZW50IGJyb2FkY2FzdGVyXG4gICAgICogQHNlZSBTaWduYWxcbiAgICAgKi9cbiAgICAvLyBhbGlhcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgKHNlZSAjZ2gtNDQpXG4gICAgc2lnbmFscy5TaWduYWwgPSBTaWduYWw7XG5cblxuXG4gICAgLy9leHBvcnRzIHRvIG11bHRpcGxlIGVudmlyb25tZW50c1xuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCl7IC8vQU1EXG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBzaWduYWxzOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKXsgLy9ub2RlXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gc2lnbmFscztcbiAgICB9IGVsc2UgeyAvL2Jyb3dzZXJcbiAgICAgICAgLy91c2Ugc3RyaW5nIGJlY2F1c2Ugb2YgR29vZ2xlIGNsb3N1cmUgY29tcGlsZXIgQURWQU5DRURfTU9ERVxuICAgICAgICAvKmpzbGludCBzdWI6dHJ1ZSAqL1xuICAgICAgICBnbG9iYWxbJ3NpZ25hbHMnXSA9IHNpZ25hbHM7XG4gICAgfVxuXG59KHRoaXMpKTtcbiJdfQ==
