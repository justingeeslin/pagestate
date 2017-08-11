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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImpzL1BhZ2UuanMiLCJqcy9QYWdlU3RhdGVDb250cm9sbGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3Nzcm9hZHMvZGlzdC9jcm9zc3JvYWRzLmpzIiwibm9kZV9tb2R1bGVzL2V4dGVuZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zZW5zaWJsZS1jb21wb25lbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc2Vuc2libGUtY29tcG9uZW50L2pzL3NlbnNpYmxlQ29tcG9uZW50LmpzIiwibm9kZV9tb2R1bGVzL3NpZ25hbHMvZGlzdC9zaWduYWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFBhZ2VTdGF0ZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2pzL1BhZ2VTdGF0ZUNvbnRyb2xsZXIuanMnKVxuY29uc3QgUGFnZSA9IHJlcXVpcmUoJy4vanMvUGFnZS5qcycpXG4iLCJjb25zdCBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKVxuY29uc3QgQ29tcG9uZW50ID0gcmVxdWlyZSgnc2Vuc2libGUtY29tcG9uZW50JylcblxudmFyIFBhZ2UgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIFRpdGxlIG9mIHRoZSBwYWdlLiBBcHBlYXJzIGluIGhpc3RvcnksIGJvb2ttYXJrcywgYW5kIHRhYnNcbiAgdmFyIHRpdGxlID0gXCJcIjtcbiAgLy8gU3VmZml4IGxpa2UgdGhlIG5hbWUgb2YgdGhlIGFwcCwgZXRjLlxuICB2YXIgc3VmZml4ID0gXCJcIjtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3RpdGxlJywge1xuICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aXRsZTsgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKG5ld1RpdGxlKSB7XG4gICAgICB0aXRsZSA9IG5ld1RpdGxlO1xuICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSArIHRoaXMuc3VmZml4O1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdWZmaXgnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHN1ZmZpeDsgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKG5ld1N1ZmZpeCkge1xuICAgICAgc3VmZml4ID0gbmV3U3VmZml4O1xuICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aGlzLnRpdGxlICsgc3VmZml4O1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSk7XG5cbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIC8vIEEgc3BlY2lhbCBjaGFyYWN0ZXIgYWZ0ZXIgd2hpY2ggaW4gdGhlIHN0YXRlIHNob3VsZCBiZSBzb21lIHNlbGVjdG9yIGZvciBhbiBlbGVtZW50IHRvIHNjcm9sbCB0b1xuICAgIGZyYWdtZW50Q2hhcmFjdGVyOiBcIiNcIixcbiAgICAvLyBUaGUgY3VycmVudCBmcmFnbWVudCBsYXN0IHNjcm9sbGVkIHRvXG4gICAgZnJhZ21lbnQ6IFwiXCIsXG4gICAgLy8gQ3VzdG9taXphYmxlIHBvc3QtbG9hZCBmdW5jdGlvblxuICAgIHBvc3Rsb2FkOiBmdW5jdGlvbigpIHsgfVxuICB9XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBkZWZhdWx0cyk7XG4gIHNlbGYgPSBleHRlbmQoc2VsZiwgb3B0aW9ucyk7XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBuZXcgQ29tcG9uZW50KHNlbGYpKTtcblxuICAkKHRoaXMudGFyZ2V0KS5vbigncG9zdGxvYWQucGFnZScsIHRoaXMucG9zdGxvYWQpO1xuXG4gIHRoaXMuc3RhdGVDaGFuZ2UgPSBmdW5jdGlvbihvbGRTdGF0ZSwgbmV3U3RhdGUpIHtcbiAgICBzZWxmLmxvZygnTmV3IHN0YXRlOiAnICsgbmV3U3RhdGUpXG4gICAgJCh0aGlzLnRhcmdldCkudHJpZ2dlcigncG9zdGxvYWQuJyArIHNlbGYuZXZlbnROYW1lc3BhY2UpO1xuICB9XG5cbiAgLy8gQSBhbGdvcml0aG0gZm9yIHNlbGVjdGluZyBlbGVtZW50cyB1c2luZyBhIHN0cmluZyBpbiB0aGUgZnJhZ21lbnQuIFNlbGVjdCB0aGUgcCBvZiB0eXBlIG9mIGEgbnVtYmVyLiBTZWxlY3QgdGhlIGlkIGlmIG5vdC5cblx0dmFyIGZyYWdtZW50RmluZCA9IGZ1bmN0aW9uKGZyYWdtZW50KSB7XG5cdFx0dmFyIHNlbGVjdG9yLCBqdW1wVGFyZ2V0O1xuXHRcdGlmIChOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlSW50KGZyYWdtZW50KSApKSB7XG5cdFx0XHRzZWxmLmxvZygnRnJhZ21lbnQgaXMgYSBudW1iZXIuLicpXG5cdFx0XHRzZWxlY3RvciA9ICdwOmVxKCcgKyBmcmFnbWVudCArICcpJ1xuXHRcdFx0anVtcFRhcmdldCA9IHNlbGYudGFyZ2V0LmZpbmQoc2VsZWN0b3IpXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0c2VsZWN0b3IgPSAnIycgKyBmcmFnbWVudDtcblx0XHRcdGp1bXBUYXJnZXQgPSBzZWxmLnRhcmdldC5maW5kKHNlbGVjdG9yKTtcblx0XHRcdC8vIElmIHdyYXBwZWQgaW4gYSBnbG93LXNwYW4sIGdsb3cgaXQsIHRoZSBwYXJlbnQsIGluc3RlYWQuXG5cdFx0XHR2YXIganVtcFRhcmdldFBhcmVudCA9IGp1bXBUYXJnZXQucGFyZW50KCk7XG5cdFx0XHRpZiAoanVtcFRhcmdldFBhcmVudC5oYXNDbGFzcygnZ2xvdy1zcGFuJykpIHtcblx0XHRcdFx0anVtcFRhcmdldCA9IGp1bXBUYXJnZXRQYXJlbnQ7XG5cdFx0XHR9XG5cdFx0fVxuXG4gICAgdmFyIGlzSnVtcFRhcmdldEZvdW5kID0ganVtcFRhcmdldC5sZW5ndGggPiAwO1xuICAgIHZhciBpc1RhcmdldGluRE9NID0gdHlwZW9mIGp1bXBUYXJnZXQub2Zmc2V0ICE9PSBcInVuZGVmaW5lZFwiO1xuICAgIGlmICghaXNKdW1wVGFyZ2V0Rm91bmQpIHtcbiAgICAgIGNvbnNvbGUud2FybignQXR0ZW1wdGluZyB0byBzY3JvbGwgdG8gYSBlbGVtZW50IHRoYXQgZG9lcyBub3QgZXhpc3QuICcsIHNlbGVjdG9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFpc1RhcmdldGluRE9NKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Njcm9sbGluZyB0byBhIGVsZW1lbnQgdGhhdCBpc250IGluIHRoZSBET00uIEV4aXRpbmcuLicsIGp1bXBUYXJnZXQpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXHRcdHJldHVybiBqdW1wVGFyZ2V0O1xuXHR9XG5cbiAgLy8gUHJvY2VzcyB0aGUgZnJhZ21lbnQgb24gdGhlIHN0YXRlXG4gICQodGhpcy50YXJnZXQpLm9uKCdwb3N0bG9hZC4nICsgdGhpcy5ldmVudE5hbWVzcGFjZSwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5mcmFnbWVudCA9IHNlbGYuc3RhdGUuc3BsaXQoc2VsZi5mcmFnbWVudENoYXJhY3RlcilbMV1cblxuICAgIGlmICh0eXBlb2Ygc2VsZi5mcmFnbWVudCA9PT0gXCJ1bmRlZmluZWRcIiB8fCBzZWxmLmZyYWdtZW50Lmxlbmd0aCA8PSAwKSB7XG4gICAgICBzZWxmLmxvZygnTm8gZnJhZ21lbnQuIEV4aXRpbmcuLiBTdGF0ZTogJyArIHNlbGYuc3RhdGUpXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbFRhcmdldCA9IGZyYWdtZW50RmluZChzZWxmLmZyYWdtZW50KTtcblxuICAgIGlmIChzY3JvbGxUYXJnZXQgPT0gZmFsc2UpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cbiAgICB2YXIgZGlzdGFuY2VUb1Njcm9sbCA9IHNjcm9sbFRhcmdldC5vZmZzZXQoKS50b3A7XG5cbiAgICAkKCdodG1sLCBib2R5Jykuc2Nyb2xsVG9wKGRpc3RhbmNlVG9TY3JvbGwpO1xuICB9KTtcblxuICAkKHRoaXMudGFyZ2V0KS50cmlnZ2VyKCdwb3N0bG9hZC4nICsgdGhpcy5ldmVudE5hbWVzcGFjZSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2U7XG4iLCJjb25zdCBjcm9zc3JvYWRzID0gcmVxdWlyZSgnY3Jvc3Nyb2FkcycpO1xuY29uc3QgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbnZhciBQYWdlU3RhdGVDb250cm9sbGVyID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgdGFyZ2V0OiAnYm9keScsXG4gICAgc3RhdGU6ICcnLFxuICAgIHJvdXRlczoge30sXG4gICAgcHJlcHJvY2Vzc1N0YXRlOiBmdW5jdGlvbihsb2NhdGlvbikge1xuICAgICAgcmV0dXJuIGxvY2F0aW9uO1xuICAgIH0sXG4gICAgLy8gRGVmaW5lIGFuIGV2ZW50IG5hbWUgZm9yIGFuIGV2ZW50IHRvIHRyaWdnZXIgd2hlbiB0aGlzIGNvbXBvbmVudCBnb2VzLlxuICAgIGV2ZW50TmFtZTogdW5kZWZpbmVkLFxuICAgIGRlYnVnOiBmYWxzZVxuICB9XG5cbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBkZWZhdWx0cylcbiAgc2VsZiA9IGV4dGVuZChzZWxmLCBvcHRpb25zKVxuXG4gIHRoaXMubG9nID0gZnVuY3Rpb24obXNnKSB7XG5cdFx0aWYgKHNlbGYuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKG1zZyk7XG5cdFx0fVxuXHR9XG5cbiAgdGhpcy50YXJnZXRFbCA9ICQodGhpcy50YXJnZXQpO1xuXG4gIC8vIEFkZCB0aGUgcm91dGVzIHRvIGNyb3Nzcm9hZHMuXG4gIGZvcih2YXIgciBpbiB0aGlzLnJvdXRlcykge1xuICAgIHRoaXMubG9nKCdBZGRlZCByb3V0ZSBmb3I6ICcsIHIpO1xuICAgIGNyb3Nzcm9hZHMuYWRkUm91dGUociwgdGhpcy5yb3V0ZXNbcl0pO1xuICB9XG5cbiAgdGhpcy5nbyA9IGZ1bmN0aW9uKCkgeztcbiAgICB2YXIgb2xkU3RhdGUgPSBzZWxmLnN0YXRlO1xuICAgIHNlbGYuc3RhdGUgPSBzZWxmLnByZXByb2Nlc3NTdGF0ZSh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB3aW5kb3cubG9jYXRpb24uaGFzaCk7XG4gICAgdmFyIG5ld1N0YXRlID0gc2VsZi5zdGF0ZTtcblxuICAgIGlmIChzZWxmLnN0YXRlID09ICcnKSB7XG4gICAgICBzZWxmLmxvZygnUGFnZSBTdGF0ZSBDb250cm9sbGVyIGdvaW5nIHdpdGggYW4gZW1wdHkgc3RhdGUuIEV4aXRpbmcuLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gUm91dGVzIEFjdGlvbnMuXG4gICAgY3Jvc3Nyb2Fkcy5wYXJzZShzZWxmLnN0YXRlKTtcblxuXG4gICAgaWYgKHR5cGVvZiBzZWxmLmV2ZW50TmFtZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgJChkb2N1bWVudC5ib2R5KS50cmlnZ2VyKHNlbGYuZXZlbnROYW1lLCBbb2xkU3RhdGUsIG5ld1N0YXRlXSApO1xuICAgIH1cbiAgfVxuXG4gICQod2luZG93KS5vbigncG9wc3RhdGUnLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmxvZygnUG9wIFN0YXRlIGZpcmVkIScpO1xuICAgIHNlbGYuZ28oKTtcbiAgfSk7XG5cbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICBzZWxmLmxvZygnRG9jdW1lbnQgcmVhZHkuJyk7XG4gICAgc2VsZi5nbygpO1xuICB9XG4gIGVsc2Uge1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5sb2coJ0RvY3VtZW50IHJlYWR5LicpO1xuICAgICAgc2VsZi5nbygpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZVN0YXRlQ29udHJvbGxlcjtcbiIsIi8qKiBAbGljZW5zZVxuICogY3Jvc3Nyb2FkcyA8aHR0cDovL21pbGxlcm1lZGVpcm9zLmdpdGh1Yi5jb20vY3Jvc3Nyb2Fkcy5qcy8+XG4gKiBBdXRob3I6IE1pbGxlciBNZWRlaXJvcyB8IE1JVCBMaWNlbnNlXG4gKiB2MC4xMi4yICgyMDE1LzA3LzMxIDE4OjM3KVxuICovXG5cbihmdW5jdGlvbiAoKSB7XG52YXIgZmFjdG9yeSA9IGZ1bmN0aW9uIChzaWduYWxzKSB7XG5cbiAgICB2YXIgY3Jvc3Nyb2FkcyxcbiAgICAgICAgX2hhc09wdGlvbmFsR3JvdXBCdWcsXG4gICAgICAgIFVOREVGO1xuXG4gICAgLy8gSGVscGVycyAtLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8vIElFIDctOCBjYXB0dXJlIG9wdGlvbmFsIGdyb3VwcyBhcyBlbXB0eSBzdHJpbmdzIHdoaWxlIG90aGVyIGJyb3dzZXJzXG4gICAgLy8gY2FwdHVyZSBhcyBgdW5kZWZpbmVkYFxuICAgIF9oYXNPcHRpb25hbEdyb3VwQnVnID0gKC90KC4rKT8vKS5leGVjKCd0JylbMV0gPT09ICcnO1xuXG4gICAgZnVuY3Rpb24gYXJyYXlJbmRleE9mKGFyciwgdmFsKSB7XG4gICAgICAgIGlmIChhcnIuaW5kZXhPZikge1xuICAgICAgICAgICAgcmV0dXJuIGFyci5pbmRleE9mKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL0FycmF5LmluZGV4T2YgZG9lc24ndCB3b3JrIG9uIElFIDYtN1xuICAgICAgICAgICAgdmFyIG4gPSBhcnIubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIGlmIChhcnJbbl0gPT09IHZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcnJheVJlbW92ZShhcnIsIGl0ZW0pIHtcbiAgICAgICAgdmFyIGkgPSBhcnJheUluZGV4T2YoYXJyLCBpdGVtKTtcbiAgICAgICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICAgICAgICBhcnIuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNLaW5kKHZhbCwga2luZCkge1xuICAgICAgICByZXR1cm4gJ1tvYmplY3QgJysga2luZCArJ10nID09PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1JlZ0V4cCh2YWwpIHtcbiAgICAgICAgcmV0dXJuIGlzS2luZCh2YWwsICdSZWdFeHAnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0FycmF5KHZhbCkge1xuICAgICAgICByZXR1cm4gaXNLaW5kKHZhbCwgJ0FycmF5Jyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWwpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbic7XG4gICAgfVxuXG4gICAgLy9ib3Jyb3dlZCBmcm9tIEFNRC11dGlsc1xuICAgIGZ1bmN0aW9uIHR5cGVjYXN0VmFsdWUodmFsKSB7XG4gICAgICAgIHZhciByO1xuICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gJ251bGwnKSB7XG4gICAgICAgICAgICByID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgciA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSBVTkRFRiB8fCB2YWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByID0gVU5ERUY7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnJyB8fCBpc05hTih2YWwpKSB7XG4gICAgICAgICAgICAvL2lzTmFOKCcnKSByZXR1cm5zIGZhbHNlXG4gICAgICAgICAgICByID0gdmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9wYXJzZUZsb2F0KG51bGwgfHwgJycpIHJldHVybnMgTmFOXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdCh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHR5cGVjYXN0QXJyYXlWYWx1ZXModmFsdWVzKSB7XG4gICAgICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICByZXN1bHRbbl0gPSB0eXBlY2FzdFZhbHVlKHZhbHVlc1tuXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBib3Jyb3dlZCBmcm9tIE1PVVRcbiAgICBmdW5jdGlvbiBkZWNvZGVRdWVyeVN0cmluZyhxdWVyeVN0ciwgc2hvdWxkVHlwZWNhc3QpIHtcbiAgICAgICAgdmFyIHF1ZXJ5QXJyID0gKHF1ZXJ5U3RyIHx8ICcnKS5yZXBsYWNlKCc/JywgJycpLnNwbGl0KCcmJyksXG4gICAgICAgICAgICByZWcgPSAvKFtePV0rKT0oLispLyxcbiAgICAgICAgICAgIGkgPSAtMSxcbiAgICAgICAgICAgIG9iaiA9IHt9LFxuICAgICAgICAgICAgZXF1YWxJbmRleCwgY3VyLCBwVmFsdWUsIHBOYW1lO1xuXG4gICAgICAgIHdoaWxlICgoY3VyID0gcXVlcnlBcnJbKytpXSkpIHtcbiAgICAgICAgICAgIGVxdWFsSW5kZXggPSBjdXIuaW5kZXhPZignPScpO1xuICAgICAgICAgICAgcE5hbWUgPSBjdXIuc3Vic3RyaW5nKDAsIGVxdWFsSW5kZXgpO1xuICAgICAgICAgICAgcFZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KGN1ci5zdWJzdHJpbmcoZXF1YWxJbmRleCArIDEpKTtcbiAgICAgICAgICAgIGlmIChzaG91bGRUeXBlY2FzdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBwVmFsdWUgPSB0eXBlY2FzdFZhbHVlKHBWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocE5hbWUgaW4gb2JqKXtcbiAgICAgICAgICAgICAgICBpZihpc0FycmF5KG9ialtwTmFtZV0pKXtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3BOYW1lXS5wdXNoKHBWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW3BOYW1lXSA9IFtvYmpbcE5hbWVdLCBwVmFsdWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqW3BOYW1lXSA9IHBWYWx1ZTtcbiAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICAvLyBDcm9zc3JvYWRzIC0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gQ3Jvc3Nyb2FkcygpIHtcbiAgICAgICAgdGhpcy5ieXBhc3NlZCA9IG5ldyBzaWduYWxzLlNpZ25hbCgpO1xuICAgICAgICB0aGlzLnJvdXRlZCA9IG5ldyBzaWduYWxzLlNpZ25hbCgpO1xuICAgICAgICB0aGlzLl9yb3V0ZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fcHJldlJvdXRlcyA9IFtdO1xuICAgICAgICB0aGlzLl9waXBlZCA9IFtdO1xuICAgICAgICB0aGlzLnJlc2V0U3RhdGUoKTtcbiAgICB9XG5cbiAgICBDcm9zc3JvYWRzLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBncmVlZHkgOiBmYWxzZSxcblxuICAgICAgICBncmVlZHlFbmFibGVkIDogdHJ1ZSxcblxuICAgICAgICBpZ25vcmVDYXNlIDogdHJ1ZSxcblxuICAgICAgICBpZ25vcmVTdGF0ZSA6IGZhbHNlLFxuXG4gICAgICAgIHNob3VsZFR5cGVjYXN0IDogZmFsc2UsXG5cbiAgICAgICAgbm9ybWFsaXplRm4gOiBudWxsLFxuXG4gICAgICAgIHJlc2V0U3RhdGUgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5fcHJldlJvdXRlcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgdGhpcy5fcHJldk1hdGNoZWRSZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZCeXBhc3NlZFJlcXVlc3QgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ3Jvc3Nyb2FkcygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZFJvdXRlIDogZnVuY3Rpb24gKHBhdHRlcm4sIGNhbGxiYWNrLCBwcmlvcml0eSkge1xuICAgICAgICAgICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdHRlcm4sIGNhbGxiYWNrLCBwcmlvcml0eSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLl9zb3J0ZWRJbnNlcnQocm91dGUpO1xuICAgICAgICAgICAgcmV0dXJuIHJvdXRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZVJvdXRlIDogZnVuY3Rpb24gKHJvdXRlKSB7XG4gICAgICAgICAgICBhcnJheVJlbW92ZSh0aGlzLl9yb3V0ZXMsIHJvdXRlKTtcbiAgICAgICAgICAgIHJvdXRlLl9kZXN0cm95KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlQWxsUm91dGVzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLmdldE51bVJvdXRlcygpO1xuICAgICAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3JvdXRlc1tuXS5fZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcm91dGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2UgOiBmdW5jdGlvbiAocmVxdWVzdCwgZGVmYXVsdEFyZ3MpIHtcbiAgICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0IHx8ICcnO1xuICAgICAgICAgICAgZGVmYXVsdEFyZ3MgPSBkZWZhdWx0QXJncyB8fCBbXTtcblxuICAgICAgICAgICAgLy8gc2hvdWxkIG9ubHkgY2FyZSBhYm91dCBkaWZmZXJlbnQgcmVxdWVzdHMgaWYgaWdub3JlU3RhdGUgaXNuJ3QgdHJ1ZVxuICAgICAgICAgICAgaWYgKCAhdGhpcy5pZ25vcmVTdGF0ZSAmJlxuICAgICAgICAgICAgICAgIChyZXF1ZXN0ID09PSB0aGlzLl9wcmV2TWF0Y2hlZFJlcXVlc3QgfHxcbiAgICAgICAgICAgICAgICAgcmVxdWVzdCA9PT0gdGhpcy5fcHJldkJ5cGFzc2VkUmVxdWVzdCkgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcm91dGVzID0gdGhpcy5fZ2V0TWF0Y2hlZFJvdXRlcyhyZXF1ZXN0KSxcbiAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICBuID0gcm91dGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBjdXI7XG5cbiAgICAgICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJldk1hdGNoZWRSZXF1ZXN0ID0gcmVxdWVzdDtcblxuICAgICAgICAgICAgICAgIHRoaXMuX25vdGlmeVByZXZSb3V0ZXMocm91dGVzLCByZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmV2Um91dGVzID0gcm91dGVzO1xuICAgICAgICAgICAgICAgIC8vc2hvdWxkIGJlIGluY3JlbWVudGFsIGxvb3AsIGV4ZWN1dGUgcm91dGVzIGluIG9yZGVyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPCBuKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ciA9IHJvdXRlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgY3VyLnJvdXRlLm1hdGNoZWQuZGlzcGF0Y2guYXBwbHkoY3VyLnJvdXRlLm1hdGNoZWQsIGRlZmF1bHRBcmdzLmNvbmNhdChjdXIucGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgICAgIGN1ci5pc0ZpcnN0ID0gIWk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm91dGVkLmRpc3BhdGNoLmFwcGx5KHRoaXMucm91dGVkLCBkZWZhdWx0QXJncy5jb25jYXQoW3JlcXVlc3QsIGN1cl0pKTtcbiAgICAgICAgICAgICAgICAgICAgaSArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJldkJ5cGFzc2VkUmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgICAgICAgICAgICAgdGhpcy5ieXBhc3NlZC5kaXNwYXRjaC5hcHBseSh0aGlzLmJ5cGFzc2VkLCBkZWZhdWx0QXJncy5jb25jYXQoW3JlcXVlc3RdKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3BpcGVQYXJzZShyZXF1ZXN0LCBkZWZhdWx0QXJncyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX25vdGlmeVByZXZSb3V0ZXMgOiBmdW5jdGlvbihtYXRjaGVkUm91dGVzLCByZXF1ZXN0KSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsIHByZXY7XG4gICAgICAgICAgICB3aGlsZSAocHJldiA9IHRoaXMuX3ByZXZSb3V0ZXNbaSsrXSkge1xuICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgc3dpdGNoZWQgZXhpc3Qgc2luY2Ugcm91dGUgbWF5IGJlIGRpc3Bvc2VkXG4gICAgICAgICAgICAgICAgaWYocHJldi5yb3V0ZS5zd2l0Y2hlZCAmJiB0aGlzLl9kaWRTd2l0Y2gocHJldi5yb3V0ZSwgbWF0Y2hlZFJvdXRlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldi5yb3V0ZS5zd2l0Y2hlZC5kaXNwYXRjaChyZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2RpZFN3aXRjaCA6IGZ1bmN0aW9uIChyb3V0ZSwgbWF0Y2hlZFJvdXRlcyl7XG4gICAgICAgICAgICB2YXIgbWF0Y2hlZCxcbiAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChtYXRjaGVkID0gbWF0Y2hlZFJvdXRlc1tpKytdKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBkaXNwYXRjaCBzd2l0Y2hlZCBpZiBpdCBpcyBnb2luZyB0byBhIGRpZmZlcmVudCByb3V0ZVxuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVkLnJvdXRlID09PSByb3V0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3BpcGVQYXJzZSA6IGZ1bmN0aW9uKHJlcXVlc3QsIGRlZmF1bHRBcmdzKSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsIHJvdXRlO1xuICAgICAgICAgICAgd2hpbGUgKHJvdXRlID0gdGhpcy5fcGlwZWRbaSsrXSkge1xuICAgICAgICAgICAgICAgIHJvdXRlLnBhcnNlKHJlcXVlc3QsIGRlZmF1bHRBcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBnZXROdW1Sb3V0ZXMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm91dGVzLmxlbmd0aDtcbiAgICAgICAgfSxcblxuICAgICAgICBfc29ydGVkSW5zZXJ0IDogZnVuY3Rpb24gKHJvdXRlKSB7XG4gICAgICAgICAgICAvL3NpbXBsaWZpZWQgaW5zZXJ0aW9uIHNvcnRcbiAgICAgICAgICAgIHZhciByb3V0ZXMgPSB0aGlzLl9yb3V0ZXMsXG4gICAgICAgICAgICAgICAgbiA9IHJvdXRlcy5sZW5ndGg7XG4gICAgICAgICAgICBkbyB7IC0tbjsgfSB3aGlsZSAocm91dGVzW25dICYmIHJvdXRlLl9wcmlvcml0eSA8PSByb3V0ZXNbbl0uX3ByaW9yaXR5KTtcbiAgICAgICAgICAgIHJvdXRlcy5zcGxpY2UobisxLCAwLCByb3V0ZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldE1hdGNoZWRSb3V0ZXMgOiBmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IFtdLFxuICAgICAgICAgICAgICAgIHJvdXRlcyA9IHRoaXMuX3JvdXRlcyxcbiAgICAgICAgICAgICAgICBuID0gcm91dGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICByb3V0ZTtcbiAgICAgICAgICAgIC8vc2hvdWxkIGJlIGRlY3JlbWVudCBsb29wIHNpbmNlIGhpZ2hlciBwcmlvcml0aWVzIGFyZSBhZGRlZCBhdCB0aGUgZW5kIG9mIGFycmF5XG4gICAgICAgICAgICB3aGlsZSAocm91dGUgPSByb3V0ZXNbLS1uXSkge1xuICAgICAgICAgICAgICAgIGlmICgoIXJlcy5sZW5ndGggfHwgdGhpcy5ncmVlZHkgfHwgcm91dGUuZ3JlZWR5KSAmJiByb3V0ZS5tYXRjaChyZXF1ZXN0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZSA6IHJvdXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zIDogcm91dGUuX2dldFBhcmFtc0FycmF5KHJlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZ3JlZWR5RW5hYmxlZCAmJiByZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGlwZSA6IGZ1bmN0aW9uIChvdGhlclJvdXRlcikge1xuICAgICAgICAgICAgdGhpcy5fcGlwZWQucHVzaChvdGhlclJvdXRlcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5waXBlIDogZnVuY3Rpb24gKG90aGVyUm91dGVyKSB7XG4gICAgICAgICAgICBhcnJheVJlbW92ZSh0aGlzLl9waXBlZCwgb3RoZXJSb3V0ZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbY3Jvc3Nyb2FkcyBudW1Sb3V0ZXM6JysgdGhpcy5nZXROdW1Sb3V0ZXMoKSArJ10nO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vXCJzdGF0aWNcIiBpbnN0YW5jZVxuICAgIGNyb3Nzcm9hZHMgPSBuZXcgQ3Jvc3Nyb2FkcygpO1xuICAgIGNyb3Nzcm9hZHMuVkVSU0lPTiA9ICcwLjEyLjInO1xuXG4gICAgY3Jvc3Nyb2Fkcy5OT1JNX0FTX0FSUkFZID0gZnVuY3Rpb24gKHJlcSwgdmFscykge1xuICAgICAgICByZXR1cm4gW3ZhbHMudmFsc19dO1xuICAgIH07XG5cbiAgICBjcm9zc3JvYWRzLk5PUk1fQVNfT0JKRUNUID0gZnVuY3Rpb24gKHJlcSwgdmFscykge1xuICAgICAgICByZXR1cm4gW3ZhbHNdO1xuICAgIH07XG5cblxuICAgIC8vIFJvdXRlIC0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFJvdXRlKHBhdHRlcm4sIGNhbGxiYWNrLCBwcmlvcml0eSwgcm91dGVyKSB7XG4gICAgICAgIHZhciBpc1JlZ2V4UGF0dGVybiA9IGlzUmVnRXhwKHBhdHRlcm4pLFxuICAgICAgICAgICAgcGF0dGVybkxleGVyID0gcm91dGVyLnBhdHRlcm5MZXhlcjtcbiAgICAgICAgdGhpcy5fcm91dGVyID0gcm91dGVyO1xuICAgICAgICB0aGlzLl9wYXR0ZXJuID0gcGF0dGVybjtcbiAgICAgICAgdGhpcy5fcGFyYW1zSWRzID0gaXNSZWdleFBhdHRlcm4/IG51bGwgOiBwYXR0ZXJuTGV4ZXIuZ2V0UGFyYW1JZHMocGF0dGVybik7XG4gICAgICAgIHRoaXMuX29wdGlvbmFsUGFyYW1zSWRzID0gaXNSZWdleFBhdHRlcm4/IG51bGwgOiBwYXR0ZXJuTGV4ZXIuZ2V0T3B0aW9uYWxQYXJhbXNJZHMocGF0dGVybik7XG4gICAgICAgIHRoaXMuX21hdGNoUmVnZXhwID0gaXNSZWdleFBhdHRlcm4/IHBhdHRlcm4gOiBwYXR0ZXJuTGV4ZXIuY29tcGlsZVBhdHRlcm4ocGF0dGVybiwgcm91dGVyLmlnbm9yZUNhc2UpO1xuICAgICAgICB0aGlzLm1hdGNoZWQgPSBuZXcgc2lnbmFscy5TaWduYWwoKTtcbiAgICAgICAgdGhpcy5zd2l0Y2hlZCA9IG5ldyBzaWduYWxzLlNpZ25hbCgpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlZC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICB9XG5cbiAgICBSb3V0ZS5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgZ3JlZWR5IDogZmFsc2UsXG5cbiAgICAgICAgcnVsZXMgOiB2b2lkKDApLFxuXG4gICAgICAgIG1hdGNoIDogZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0IHx8ICcnO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hdGNoUmVnZXhwLnRlc3QocmVxdWVzdCkgJiYgdGhpcy5fdmFsaWRhdGVQYXJhbXMocmVxdWVzdCk7IC8vdmFsaWRhdGUgcGFyYW1zIGV2ZW4gaWYgcmVnZXhwIGJlY2F1c2Ugb2YgYHJlcXVlc3RfYCBydWxlLlxuICAgICAgICB9LFxuXG4gICAgICAgIF92YWxpZGF0ZVBhcmFtcyA6IGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLnJ1bGVzLFxuICAgICAgICAgICAgICAgIHZhbHVlcyA9IHRoaXMuX2dldFBhcmFtc09iamVjdChyZXF1ZXN0KSxcbiAgICAgICAgICAgICAgICBrZXk7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBydWxlcykge1xuICAgICAgICAgICAgICAgIC8vIG5vcm1hbGl6ZV8gaXNuJ3QgYSB2YWxpZGF0aW9uIHJ1bGUuLi4gKCMzOSlcbiAgICAgICAgICAgICAgICBpZihrZXkgIT09ICdub3JtYWxpemVfJyAmJiBydWxlcy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmICEgdGhpcy5faXNWYWxpZFBhcmFtKHJlcXVlc3QsIGtleSwgdmFsdWVzKSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNWYWxpZFBhcmFtIDogZnVuY3Rpb24gKHJlcXVlc3QsIHByb3AsIHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25SdWxlID0gdGhpcy5ydWxlc1twcm9wXSxcbiAgICAgICAgICAgICAgICB2YWwgPSB2YWx1ZXNbcHJvcF0sXG4gICAgICAgICAgICAgICAgaXNWYWxpZCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzUXVlcnkgPSAocHJvcC5pbmRleE9mKCc/JykgPT09IDApO1xuXG4gICAgICAgICAgICBpZiAodmFsID09IG51bGwgJiYgdGhpcy5fb3B0aW9uYWxQYXJhbXNJZHMgJiYgYXJyYXlJbmRleE9mKHRoaXMuX29wdGlvbmFsUGFyYW1zSWRzLCBwcm9wKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzUmVnRXhwKHZhbGlkYXRpb25SdWxlKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc1F1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbHVlc1twcm9wICsnXyddOyAvL3VzZSByYXcgc3RyaW5nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB2YWxpZGF0aW9uUnVsZS50ZXN0KHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0FycmF5KHZhbGlkYXRpb25SdWxlKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc1F1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHZhbHVlc1twcm9wICsnXyddOyAvL3VzZSByYXcgc3RyaW5nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB0aGlzLl9pc1ZhbGlkQXJyYXlSdWxlKHZhbGlkYXRpb25SdWxlLCB2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNGdW5jdGlvbih2YWxpZGF0aW9uUnVsZSkpIHtcbiAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdmFsaWRhdGlvblJ1bGUodmFsLCByZXF1ZXN0LCB2YWx1ZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZDsgLy9mYWlsIHNpbGVudGx5IGlmIHZhbGlkYXRpb25SdWxlIGlzIGZyb20gYW4gdW5zdXBwb3J0ZWQgdHlwZVxuICAgICAgICB9LFxuXG4gICAgICAgIF9pc1ZhbGlkQXJyYXlSdWxlIDogZnVuY3Rpb24gKGFyciwgdmFsKSB7XG4gICAgICAgICAgICBpZiAoISB0aGlzLl9yb3V0ZXIuaWdub3JlQ2FzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnJheUluZGV4T2YoYXJyLCB2YWwpICE9PSAtMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gdmFsLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBuID0gYXJyLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICAgIGNvbXBhcmVWYWw7XG5cbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gYXJyW25dO1xuICAgICAgICAgICAgICAgIGNvbXBhcmVWYWwgPSAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKT8gaXRlbS50b0xvd2VyQ2FzZSgpIDogaXRlbTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGFyZVZhbCA9PT0gdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0UGFyYW1zT2JqZWN0IDogZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICAgIHZhciBzaG91bGRUeXBlY2FzdCA9IHRoaXMuX3JvdXRlci5zaG91bGRUeXBlY2FzdCxcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSB0aGlzLl9yb3V0ZXIucGF0dGVybkxleGVyLmdldFBhcmFtVmFsdWVzKHJlcXVlc3QsIHRoaXMuX21hdGNoUmVnZXhwLCBzaG91bGRUeXBlY2FzdCksXG4gICAgICAgICAgICAgICAgbyA9IHt9LFxuICAgICAgICAgICAgICAgIG4gPSB2YWx1ZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHBhcmFtLCB2YWw7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gdmFsdWVzW25dO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wYXJhbXNJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW0gPSB0aGlzLl9wYXJhbXNJZHNbbl07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbS5pbmRleE9mKCc/JykgPT09IDAgJiYgdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL21ha2UgYSBjb3B5IG9mIHRoZSBvcmlnaW5hbCBzdHJpbmcgc28gYXJyYXkgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1JlZ0V4cCB2YWxpZGF0aW9uIGNhbiBiZSBhcHBsaWVkIHByb3Blcmx5XG4gICAgICAgICAgICAgICAgICAgICAgICBvW3BhcmFtICsnXyddID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy91cGRhdGUgdmFsc18gYXJyYXkgYXMgd2VsbCBzaW5jZSBpdCB3aWxsIGJlIHVzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZHVyaW5nIGRpc3BhdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBkZWNvZGVRdWVyeVN0cmluZyh2YWwsIHNob3VsZFR5cGVjYXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1tuXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBJRSB3aWxsIGNhcHR1cmUgb3B0aW9uYWwgZ3JvdXBzIGFzIGVtcHR5IHN0cmluZ3Mgd2hpbGUgb3RoZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gYnJvd3NlcnMgd2lsbCBjYXB0dXJlIGB1bmRlZmluZWRgIHNvIG5vcm1hbGl6ZSBiZWhhdmlvci5cbiAgICAgICAgICAgICAgICAgICAgLy8gc2VlOiAjZ2gtNTgsICNnaC01OSwgI2doLTYwXG4gICAgICAgICAgICAgICAgICAgIGlmICggX2hhc09wdGlvbmFsR3JvdXBCdWcgJiYgdmFsID09PSAnJyAmJiBhcnJheUluZGV4T2YodGhpcy5fb3B0aW9uYWxQYXJhbXNJZHMsIHBhcmFtKSAhPT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSB2b2lkKDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW25dID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9bcGFyYW1dID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2FsaWFzIHRvIHBhdGhzIGFuZCBmb3IgUmVnRXhwIHBhdHRlcm5cbiAgICAgICAgICAgICAgICBvW25dID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgby5yZXF1ZXN0XyA9IHNob3VsZFR5cGVjYXN0PyB0eXBlY2FzdFZhbHVlKHJlcXVlc3QpIDogcmVxdWVzdDtcbiAgICAgICAgICAgIG8udmFsc18gPSB2YWx1ZXM7XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0UGFyYW1zQXJyYXkgOiBmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAgICAgdmFyIG5vcm0gPSB0aGlzLnJ1bGVzPyB0aGlzLnJ1bGVzLm5vcm1hbGl6ZV8gOiBudWxsLFxuICAgICAgICAgICAgICAgIHBhcmFtcztcbiAgICAgICAgICAgIG5vcm0gPSBub3JtIHx8IHRoaXMuX3JvdXRlci5ub3JtYWxpemVGbjsgLy8gZGVmYXVsdCBub3JtYWxpemVcbiAgICAgICAgICAgIGlmIChub3JtICYmIGlzRnVuY3Rpb24obm9ybSkpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBub3JtKHJlcXVlc3QsIHRoaXMuX2dldFBhcmFtc09iamVjdChyZXF1ZXN0KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHRoaXMuX2dldFBhcmFtc09iamVjdChyZXF1ZXN0KS52YWxzXztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW50ZXJwb2xhdGUgOiBmdW5jdGlvbihyZXBsYWNlbWVudHMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSB0aGlzLl9yb3V0ZXIucGF0dGVybkxleGVyLmludGVycG9sYXRlKHRoaXMuX3BhdHRlcm4sIHJlcGxhY2VtZW50cyk7XG4gICAgICAgICAgICBpZiAoISB0aGlzLl92YWxpZGF0ZVBhcmFtcyhzdHIpICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignR2VuZXJhdGVkIHN0cmluZyBkb2VzblxcJ3QgdmFsaWRhdGUgYWdhaW5zdCBgUm91dGUucnVsZXNgLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfSxcblxuICAgICAgICBkaXNwb3NlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fcm91dGVyLnJlbW92ZVJvdXRlKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9kZXN0cm95IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuc3dpdGNoZWQuZGlzcG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVkID0gdGhpcy5zd2l0Y2hlZCA9IHRoaXMuX3BhdHRlcm4gPSB0aGlzLl9tYXRjaFJlZ2V4cCA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1tSb3V0ZSBwYXR0ZXJuOlwiJysgdGhpcy5fcGF0dGVybiArJ1wiLCBudW1MaXN0ZW5lcnM6JysgdGhpcy5tYXRjaGVkLmdldE51bUxpc3RlbmVycygpICsnXSc7XG4gICAgICAgIH1cblxuICAgIH07XG5cblxuXG4gICAgLy8gUGF0dGVybiBMZXhlciAtLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgQ3Jvc3Nyb2Fkcy5wcm90b3R5cGUucGF0dGVybkxleGVyID0gKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXJcbiAgICAgICAgICAgIC8vbWF0Y2ggY2hhcnMgdGhhdCBzaG91bGQgYmUgZXNjYXBlZCBvbiBzdHJpbmcgcmVnZXhwXG4gICAgICAgICAgICBFU0NBUEVfQ0hBUlNfUkVHRVhQID0gL1tcXFxcLisqP1xcXiRcXFtcXF0oKXt9XFwvJyNdL2csXG5cbiAgICAgICAgICAgIC8vdHJhaWxpbmcgc2xhc2hlcyAoYmVnaW4vZW5kIG9mIHN0cmluZylcbiAgICAgICAgICAgIExPT1NFX1NMQVNIRVNfUkVHRVhQID0gL15cXC98XFwvJC9nLFxuICAgICAgICAgICAgTEVHQUNZX1NMQVNIRVNfUkVHRVhQID0gL1xcLyQvZyxcblxuICAgICAgICAgICAgLy9wYXJhbXMgLSBldmVyeXRoaW5nIGJldHdlZW4gYHsgfWAgb3IgYDogOmBcbiAgICAgICAgICAgIFBBUkFNU19SRUdFWFAgPSAvKD86XFx7fDopKFtefTpdKykoPzpcXH18OikvZyxcblxuICAgICAgICAgICAgLy91c2VkIHRvIHNhdmUgcGFyYW1zIGR1cmluZyBjb21waWxlIChhdm9pZCBlc2NhcGluZyB0aGluZ3MgdGhhdFxuICAgICAgICAgICAgLy9zaG91bGRuJ3QgYmUgZXNjYXBlZCkuXG4gICAgICAgICAgICBUT0tFTlMgPSB7XG4gICAgICAgICAgICAgICAgJ09TJyA6IHtcbiAgICAgICAgICAgICAgICAgICAgLy9vcHRpb25hbCBzbGFzaGVzXG4gICAgICAgICAgICAgICAgICAgIC8vc2xhc2ggYmV0d2VlbiBgOjpgIG9yIGB9OmAgb3IgYFxcdzpgIG9yIGA6ez9gIG9yIGB9ez9gIG9yIGBcXHd7P2BcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogLyhbOn1dfFxcdyg/PVxcLykpXFwvPyg6fCg/Olxce1xcPykpL2csXG4gICAgICAgICAgICAgICAgICAgIHNhdmUgOiAnJDF7e2lkfX0kMicsXG4gICAgICAgICAgICAgICAgICAgIHJlcyA6ICdcXFxcLz8nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnUlMnIDoge1xuICAgICAgICAgICAgICAgICAgICAvL3JlcXVpcmVkIHNsYXNoZXNcbiAgICAgICAgICAgICAgICAgICAgLy91c2VkIHRvIGluc2VydCBzbGFzaCBiZXR3ZWVuIGA6e2AgYW5kIGB9e2BcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogLyhbOn1dKVxcLz8oXFx7KS9nLFxuICAgICAgICAgICAgICAgICAgICBzYXZlIDogJyQxe3tpZH19JDInLFxuICAgICAgICAgICAgICAgICAgICByZXMgOiAnXFxcXC8nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnUlEnIDoge1xuICAgICAgICAgICAgICAgICAgICAvL3JlcXVpcmVkIHF1ZXJ5IHN0cmluZyAtIGV2ZXJ5dGhpbmcgaW4gYmV0d2VlbiBgez8gfWBcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogL1xce1xcPyhbXn1dKylcXH0vZyxcbiAgICAgICAgICAgICAgICAgICAgLy9ldmVyeXRoaW5nIGZyb20gYD9gIHRpbGwgYCNgIG9yIGVuZCBvZiBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgcmVzIDogJ1xcXFw/KFteI10rKSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdPUScgOiB7XG4gICAgICAgICAgICAgICAgICAgIC8vb3B0aW9uYWwgcXVlcnkgc3RyaW5nIC0gZXZlcnl0aGluZyBpbiBiZXR3ZWVuIGA6PyA6YFxuICAgICAgICAgICAgICAgICAgICByZ3ggOiAvOlxcPyhbXjpdKyk6L2csXG4gICAgICAgICAgICAgICAgICAgIC8vZXZlcnl0aGluZyBmcm9tIGA/YCB0aWxsIGAjYCBvciBlbmQgb2Ygc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHJlcyA6ICcoPzpcXFxcPyhbXiNdKikpPydcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdPUicgOiB7XG4gICAgICAgICAgICAgICAgICAgIC8vb3B0aW9uYWwgcmVzdCAtIGV2ZXJ5dGhpbmcgaW4gYmV0d2VlbiBgOiAqOmBcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogLzooW146XSspXFwqOi9nLFxuICAgICAgICAgICAgICAgICAgICByZXMgOiAnKC4qKT8nIC8vIG9wdGlvbmFsIGdyb3VwIHRvIGF2b2lkIHBhc3NpbmcgZW1wdHkgc3RyaW5nIGFzIGNhcHR1cmVkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnUlInIDoge1xuICAgICAgICAgICAgICAgICAgICAvL3Jlc3QgcGFyYW0gLSBldmVyeXRoaW5nIGluIGJldHdlZW4gYHsgKn1gXG4gICAgICAgICAgICAgICAgICAgIHJneCA6IC9cXHsoW159XSspXFwqXFx9L2csXG4gICAgICAgICAgICAgICAgICAgIHJlcyA6ICcoLispJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8gcmVxdWlyZWQvb3B0aW9uYWwgcGFyYW1zIHNob3VsZCBjb21lIGFmdGVyIHJlc3Qgc2VnbWVudHNcbiAgICAgICAgICAgICAgICAnUlAnIDoge1xuICAgICAgICAgICAgICAgICAgICAvL3JlcXVpcmVkIHBhcmFtcyAtIGV2ZXJ5dGhpbmcgYmV0d2VlbiBgeyB9YFxuICAgICAgICAgICAgICAgICAgICByZ3ggOiAvXFx7KFtefV0rKVxcfS9nLFxuICAgICAgICAgICAgICAgICAgICByZXMgOiAnKFteXFxcXC8/XSspJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ09QJyA6IHtcbiAgICAgICAgICAgICAgICAgICAgLy9vcHRpb25hbCBwYXJhbXMgLSBldmVyeXRoaW5nIGJldHdlZW4gYDogOmBcbiAgICAgICAgICAgICAgICAgICAgcmd4IDogLzooW146XSspOi9nLFxuICAgICAgICAgICAgICAgICAgICByZXMgOiAnKFteXFxcXC8/XSspP1xcLz8nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgTE9PU0VfU0xBU0ggPSAxLFxuICAgICAgICAgICAgU1RSSUNUX1NMQVNIID0gMixcbiAgICAgICAgICAgIExFR0FDWV9TTEFTSCA9IDMsXG5cbiAgICAgICAgICAgIF9zbGFzaE1vZGUgPSBMT09TRV9TTEFTSDtcblxuXG4gICAgICAgIGZ1bmN0aW9uIHByZWNvbXBpbGVUb2tlbnMoKXtcbiAgICAgICAgICAgIHZhciBrZXksIGN1cjtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIFRPS0VOUykge1xuICAgICAgICAgICAgICAgIGlmIChUT0tFTlMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjdXIgPSBUT0tFTlNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgY3VyLmlkID0gJ19fQ1JfJysga2V5ICsnX18nO1xuICAgICAgICAgICAgICAgICAgICBjdXIuc2F2ZSA9ICgnc2F2ZScgaW4gY3VyKT8gY3VyLnNhdmUucmVwbGFjZSgne3tpZH19JywgY3VyLmlkKSA6IGN1ci5pZDtcbiAgICAgICAgICAgICAgICAgICAgY3VyLnJSZXN0b3JlID0gbmV3IFJlZ0V4cChjdXIuaWQsICdnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByZWNvbXBpbGVUb2tlbnMoKTtcblxuXG4gICAgICAgIGZ1bmN0aW9uIGNhcHR1cmVWYWxzKHJlZ2V4LCBwYXR0ZXJuKSB7XG4gICAgICAgICAgICB2YXIgdmFscyA9IFtdLCBtYXRjaDtcbiAgICAgICAgICAgIC8vIHZlcnkgaW1wb3J0YW50IHRvIHJlc2V0IGxhc3RJbmRleCBzaW5jZSBSZWdFeHAgY2FuIGhhdmUgXCJnXCIgZmxhZ1xuICAgICAgICAgICAgLy8gYW5kIG11bHRpcGxlIHJ1bnMgbWlnaHQgYWZmZWN0IHRoZSByZXN1bHQsIHNwZWNpYWxseSBpZiBtYXRjaGluZ1xuICAgICAgICAgICAgLy8gc2FtZSBzdHJpbmcgbXVsdGlwbGUgdGltZXMgb24gSUUgNy04XG4gICAgICAgICAgICByZWdleC5sYXN0SW5kZXggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKG1hdGNoID0gcmVnZXguZXhlYyhwYXR0ZXJuKSkge1xuICAgICAgICAgICAgICAgIHZhbHMucHVzaChtYXRjaFsxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFscztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFBhcmFtSWRzKHBhdHRlcm4pIHtcbiAgICAgICAgICAgIHJldHVybiBjYXB0dXJlVmFscyhQQVJBTVNfUkVHRVhQLCBwYXR0ZXJuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldE9wdGlvbmFsUGFyYW1zSWRzKHBhdHRlcm4pIHtcbiAgICAgICAgICAgIHJldHVybiBjYXB0dXJlVmFscyhUT0tFTlMuT1Aucmd4LCBwYXR0ZXJuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBpbGVQYXR0ZXJuKHBhdHRlcm4sIGlnbm9yZUNhc2UpIHtcbiAgICAgICAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuIHx8ICcnO1xuXG4gICAgICAgICAgICBpZihwYXR0ZXJuKXtcbiAgICAgICAgICAgICAgICBpZiAoX3NsYXNoTW9kZSA9PT0gTE9PU0VfU0xBU0gpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShMT09TRV9TTEFTSEVTX1JFR0VYUCwgJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChfc2xhc2hNb2RlID09PSBMRUdBQ1lfU0xBU0gpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShMRUdBQ1lfU0xBU0hFU19SRUdFWFAsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL3NhdmUgdG9rZW5zXG4gICAgICAgICAgICAgICAgcGF0dGVybiA9IHJlcGxhY2VUb2tlbnMocGF0dGVybiwgJ3JneCcsICdzYXZlJyk7XG4gICAgICAgICAgICAgICAgLy9yZWdleHAgZXNjYXBlXG4gICAgICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShFU0NBUEVfQ0hBUlNfUkVHRVhQLCAnXFxcXCQmJyk7XG4gICAgICAgICAgICAgICAgLy9yZXN0b3JlIHRva2Vuc1xuICAgICAgICAgICAgICAgIHBhdHRlcm4gPSByZXBsYWNlVG9rZW5zKHBhdHRlcm4sICdyUmVzdG9yZScsICdyZXMnKTtcblxuICAgICAgICAgICAgICAgIGlmIChfc2xhc2hNb2RlID09PSBMT09TRV9TTEFTSCkge1xuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuID0gJ1xcXFwvPycrIHBhdHRlcm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoX3NsYXNoTW9kZSAhPT0gU1RSSUNUX1NMQVNIKSB7XG4gICAgICAgICAgICAgICAgLy9zaW5nbGUgc2xhc2ggaXMgdHJlYXRlZCBhcyBlbXB0eSBhbmQgZW5kIHNsYXNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICAgICAgcGF0dGVybiArPSAnXFxcXC8/JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKCdeJysgcGF0dGVybiArICckJywgaWdub3JlQ2FzZT8gJ2knIDogJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVwbGFjZVRva2VucyhwYXR0ZXJuLCByZWdleHBOYW1lLCByZXBsYWNlTmFtZSkge1xuICAgICAgICAgICAgdmFyIGN1ciwga2V5O1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gVE9LRU5TKSB7XG4gICAgICAgICAgICAgICAgaWYgKFRPS0VOUy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ciA9IFRPS0VOU1trZXldO1xuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuID0gcGF0dGVybi5yZXBsYWNlKGN1cltyZWdleHBOYW1lXSwgY3VyW3JlcGxhY2VOYW1lXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhdHRlcm47XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRQYXJhbVZhbHVlcyhyZXF1ZXN0LCByZWdleHAsIHNob3VsZFR5cGVjYXN0KSB7XG4gICAgICAgICAgICB2YXIgdmFscyA9IHJlZ2V4cC5leGVjKHJlcXVlc3QpO1xuICAgICAgICAgICAgaWYgKHZhbHMpIHtcbiAgICAgICAgICAgICAgICB2YWxzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFR5cGVjYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHMgPSB0eXBlY2FzdEFycmF5VmFsdWVzKHZhbHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWxzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW50ZXJwb2xhdGUocGF0dGVybiwgcmVwbGFjZW1lbnRzKSB7XG4gICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGFuIGVtcHR5IG9iamVjdCBiZWNhdXNlIHBhdHRlcm4gbWlnaHQgaGF2ZSBqdXN0XG4gICAgICAgICAgICAvLyBvcHRpb25hbCBhcmd1bWVudHNcbiAgICAgICAgICAgIHJlcGxhY2VtZW50cyA9IHJlcGxhY2VtZW50cyB8fCB7fTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGF0dGVybiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JvdXRlIHBhdHRlcm4gc2hvdWxkIGJlIGEgc3RyaW5nLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVwbGFjZUZuID0gZnVuY3Rpb24obWF0Y2gsIHByb3Ape1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsO1xuICAgICAgICAgICAgICAgICAgICBwcm9wID0gKHByb3Auc3Vic3RyKDAsIDEpID09PSAnPycpPyBwcm9wLnN1YnN0cigxKSA6IHByb3A7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlbWVudHNbcHJvcF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudHNbcHJvcF0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5UGFydHMgPSBbXSwgcmVwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIga2V5IGluIHJlcGxhY2VtZW50c1twcm9wXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXAgPSByZXBsYWNlbWVudHNbcHJvcF1ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkocmVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiByZXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGtleS5zbGljZSgtMikgPT0gJ1tdJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlQYXJ0cy5wdXNoKGVuY29kZVVSSShrZXkuc2xpY2UoMCwgLTIpKSArICdbXT0nICsgZW5jb2RlVVJJKHJlcFtrXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5UGFydHMucHVzaChlbmNvZGVVUkkoa2V5ICsgJz0nICsgcmVwW2tdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlQYXJ0cy5wdXNoKGVuY29kZVVSSShrZXkgKyAnPScgKyByZXApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAnPycgKyBxdWVyeVBhcnRzLmpvaW4oJyYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHZhbHVlIGlzIGEgc3RyaW5nIHNlZSAjZ2gtNTRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBTdHJpbmcocmVwbGFjZW1lbnRzW3Byb3BdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoLmluZGV4T2YoJyonKSA9PT0gLTEgJiYgdmFsLmluZGV4T2YoJy8nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWUgXCInKyB2YWwgKydcIiBmb3Igc2VnbWVudCBcIicrIG1hdGNoICsnXCIuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobWF0Y2guaW5kZXhPZigneycpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc2VnbWVudCAnKyBtYXRjaCArJyBpcyByZXF1aXJlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCEgVE9LRU5TLk9TLnRyYWlsKSB7XG4gICAgICAgICAgICAgICAgVE9LRU5TLk9TLnRyYWlsID0gbmV3IFJlZ0V4cCgnKD86JysgVE9LRU5TLk9TLmlkICsnKSskJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShUT0tFTlMuT1Mucmd4LCBUT0tFTlMuT1Muc2F2ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKFBBUkFNU19SRUdFWFAsIHJlcGxhY2VGbilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKFRPS0VOUy5PUy50cmFpbCwgJycpIC8vIHJlbW92ZSB0cmFpbGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoVE9LRU5TLk9TLnJSZXN0b3JlLCAnLycpOyAvLyBhZGQgc2xhc2ggYmV0d2VlbiBzZWdtZW50c1xuICAgICAgICB9XG5cbiAgICAgICAgLy9BUElcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0cmljdCA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3NsYXNoTW9kZSA9IFNUUklDVF9TTEFTSDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb29zZSA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3NsYXNoTW9kZSA9IExPT1NFX1NMQVNIO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxlZ2FjeSA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3NsYXNoTW9kZSA9IExFR0FDWV9TTEFTSDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQYXJhbUlkcyA6IGdldFBhcmFtSWRzLFxuICAgICAgICAgICAgZ2V0T3B0aW9uYWxQYXJhbXNJZHMgOiBnZXRPcHRpb25hbFBhcmFtc0lkcyxcbiAgICAgICAgICAgIGdldFBhcmFtVmFsdWVzIDogZ2V0UGFyYW1WYWx1ZXMsXG4gICAgICAgICAgICBjb21waWxlUGF0dGVybiA6IGNvbXBpbGVQYXR0ZXJuLFxuICAgICAgICAgICAgaW50ZXJwb2xhdGUgOiBpbnRlcnBvbGF0ZVxuICAgICAgICB9O1xuXG4gICAgfSgpKTtcblxuXG4gICAgcmV0dXJuIGNyb3Nzcm9hZHM7XG59O1xuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFsnc2lnbmFscyddLCBmYWN0b3J5KTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy9Ob2RlXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3NpZ25hbHMnKSk7XG59IGVsc2Uge1xuICAgIC8qanNoaW50IHN1Yjp0cnVlICovXG4gICAgd2luZG93Wydjcm9zc3JvYWRzJ10gPSBmYWN0b3J5KHdpbmRvd1snc2lnbmFscyddKTtcbn1cblxufSgpKTtcblxuIiwiZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgYS5fc3VwZXIgPSBiXG4gIGZvcih2YXIga2V5IGluIGIpIHtcbiAgICBpZihiLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gICAgLy8gRG9lcyB0aGUgcHJvcGVydHkgaGF2ZSBhIGN1c3RvbSBnZXR0ZXIgb3Igc2V0dGVyP1xuICAgIGlmICh0eXBlb2YgYi5fX2xvb2t1cEdldHRlcl9fKGtleSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnZm91bmQgYSBnZXR0ZXIgZm9yICcgKyBrZXkpO1xuICAgICAgYS5fX2RlZmluZUdldHRlcl9fKGtleSwgYi5fX2xvb2t1cEdldHRlcl9fKGtleSkpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYi5fX2xvb2t1cFNldHRlcl9fKGtleSkgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnZm91bmQgYSBzZXR0ZXIgZm9yICcgKyBrZXkpO1xuICAgICAgYS5fX2RlZmluZVNldHRlcl9fKGtleSwgYi5fX2xvb2t1cFNldHRlcl9fKGtleSkpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gYTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHRlbmQ7XG4iLCJ3aW5kb3cuc2Vuc2libGUgPSB0eXBlb2Ygc2Vuc2libGUgIT09IFwidW5kZWZpbmVkXCIgPyBzZW5zaWJsZSA6IHt9O1xuc2Vuc2libGUuY2xhc3NlcyA9IHR5cGVvZiBzZW5zaWJsZS5jbGFzc2VzICE9PSBcInVuZGVmaW5lZFwiID8gc2Vuc2libGUuY2xhc3NlcyA6IHt9O1xuXG5zZW5zaWJsZS5jbGFzc2VzLkNvbXBvbmVudCA9IHJlcXVpcmUoJy4vanMvc2Vuc2libGVDb21wb25lbnQuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZW5zaWJsZS5jbGFzc2VzLkNvbXBvbmVudDtcbiIsInZhciBDb21wb25lbnQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0ZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cblx0Ly8gVXNlIHRoZSBwcml2YXRlIG1lbWJlcnMgZm9yIGN1c3RvbSBoaWRkZW4gc2V0dGVycyBhbmQgZ2V0dGVycy5cblx0Ly8gQW4gaWRlbnRpZmllciBmb3IgdGhlIGNvbXBvbmVudCdzIGN1cnJlbnQgc3RhdGUuXG5cdHZhciBzdGF0ZSA9ICcnO1xuXHQvLyBUaGUgZWxlbWVudCB0byB3aGljaCB0aGlzIGNvbXBvbmVudCAoZWwpIHNob3VsZCBiZSByZW5kZXJlZC9hcHBlbmRlZCB0by5cblx0dmFyIHRhcmdldCA9IHVuZGVmaW5lZDtcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Ly8gVG8gbG9nIG9yIG5vdCB0byBsb2cuLlxuXHRcdGRlYnVnOiBmYWxzZSxcblx0XHRlbCA6ICQoZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKSxcblx0XHRzdGF0ZUNoYW5nZSA6IGZ1bmN0aW9uKG9sZFN0YXRlLCBuZXdTdGF0ZSkge1xuXHRcdFx0c2VsZi5sb2coJ0NoYW5naW5nIHN0YXRlIGZyb20gJyArIG9sZFN0YXRlICsgJyB0byAnICsgbmV3U3RhdGUpO1xuXHRcdH0sXG5cdFx0cHJlbG9hZDogZnVuY3Rpb24oKSB7IH0sXG5cdFx0cG9zdGxvYWQ6IGZ1bmN0aW9uKCkgeyB9LFxuXHRcdHN0YXRlUHJlcHJvY2VzczogZnVuY3Rpb24oc3RhdGUpIHtcblx0XHRcdHJldHVybiBzdGF0ZTtcblx0XHR9LFxuXHRcdC8vIFRvIGF2b2lkIGNvbGxpc2lvbnMgYW5kIGluY2FzZSB5b3Ugd2FudCB0byBuYW1lc3BhY2UgaW5kaXZpZHVhbCBjb21wb25lbnRzXG5cdFx0ZXZlbnROYW1lc3BhY2U6ICdzZW5zaWJsZScsXG5cdFx0Ly8gQ2FsbCByZW5kZXIgYXV0b21hdGljYWxseSB1cG9uIGNvbnN0cnVjdGlvbiBiZWN1c2Ugc29tZXRpbWVzIHlvdSBqdXN0IHdhbnQgdG8gY29uc3RydWN0IHRoZSB0aGluZy4gRGlzYWJsZSBpZiB0aGUgY29tcG9uZW50IHJlcXVlc3QgZGF0YSBhc3luYyBhbmQgc2hvdWxkIG5vdCBiZSBzaG93IHVudGlsIGl0IGlzIGxvYWRlZC5cblx0XHRhdXRvUmVuZGVyOiB0cnVlLFxuXHR9O1xuXG5cdC8vIFN1cHBseSBhIGRlZmF1bHQgdGFyZ2V0IG9ubHkgYXMgYSBsYXN0IHJlc29ydC4gVGhpcyB3YXkgdGhlIGJvZHkgaXNuJ3Qgc2VsZWN0ZWQgZXZlcnkgdGltZS5cblx0aWYgKHR5cGVvZiAkY29udGVudFRhcmdldCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdGRlZmF1bHRzLnRhcmdldCA9ICRjb250ZW50VGFyZ2V0O1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBvcHRpb25zLnRhcmdldCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHRhcmdldCA9IG9wdGlvbnMudGFyZ2V0XG5cdH1cblx0ZWxzZSB7XG5cdFx0dGFyZ2V0ID0gJChkb2N1bWVudC5ib2R5KTtcblx0fVxuXG5cdHRoaXMubG9nID0gZnVuY3Rpb24obXNnKSB7XG5cdFx0aWYgKHNlbGYuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKG1zZyk7XG5cdFx0fVxuXHR9XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICd0YXJnZXQnLCB7XG5cdFx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0YXJnZXQ7XG5cdFx0fSxcblx0XHRzZXQ6IGZ1bmN0aW9uKGFyZykge1xuXHRcdFx0Ly8gSWYgdGhlIGFyZ3VtZW50IGlzIGEgc3RyaW5nLCBpdCBpcyBhIHNlbGVjdG9yIGNvbnZlcnQgaXQgdG8gYSBqUXVlcnkgb2JqZWN0XG5cdFx0XHRpZiAodHlwZW9mIGFyZyA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHR0YXJnZXQgPSAkKGFyZyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBqUXVlcnkpIHtcblx0XHRcdFx0dGFyZ2V0ID0gYXJnXG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdVbnJlZ29uaXplZCB0YXJnZXQgc2VsZWN0b3IuJywgYXJnKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGVudW1lcmFibGU6IHRydWVcblx0fSk7XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdGF0ZScsIHtcblx0XHRnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3RhdGU7IH0sXG5cdFx0c2V0OiBmdW5jdGlvbihuZXdTdGF0ZSkge1xuXHRcdFx0dmFyIG9sZFN0YXRlID0gc3RhdGU7XG5cdFx0XHRuZXdTdGF0ZSA9IHRoaXMuc3RhdGVQcmVwcm9jZXNzKG5ld1N0YXRlKTtcblx0XHRcdHN0YXRlID0gbmV3U3RhdGU7XG5cdFx0XHR0aGlzLnN0YXRlQ2hhbmdlKG9sZFN0YXRlLCBuZXdTdGF0ZSlcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fSxcblx0XHRlbnVtZXJhYmxlOiB0cnVlXG5cdH0pO1xuXG5cdC8vICQuZXh0ZW5kKHRoaXMsIGRlZmF1bHRzLCBvcHRpb25zKTtcblx0c2VsZiA9IGV4dGVuZCh0aGlzLCBkZWZhdWx0cylcblx0c2VsZiA9IGV4dGVuZCh0aGlzLCBvcHRpb25zKVxuXG5cdC8vIEV4dGVuZCBkb2VzIG5vdCB0cmlnZ2VyIGN1c3RvbSBzZXR0ZXJzIGFuZCBnZXR0ZXJzLiBUaGVyZSBhcmUgc29tZSBwcm9wZXJ0aWVzIHRoYXQgaWYgZGVmaW5lZCBvbiBpbml0IHRoZSBjdXN0b20gc2V0dGVyL2dldHRlciBpcyBub3QgY2FsbGVkLiBtYWtlIHRoZSBhc3NpZ21lbnQgbWFudWFsbHkgZm9yIHRoZXNlIHNlbnNpdGl2ZSBwcm9wZXJ0aWVzLlxuXHRpZiAob3B0aW9ucyAmJiBvcHRpb25zLnN0YXRlKSB7XG5cdFx0dGhpcy5zdGF0ZSA9IG9wdGlvbnMuc3RhdGVcblx0fVxuXG5cdHRoaXMuZ28gPSBmdW5jdGlvbihuZXdTdGF0ZSkge1xuXHRcdHRoaXMuc3RhdGUgPSBuZXdTdGF0ZTtcblx0fVxuXG5cdC8vIEFwcGVuZCB0aGUgRWwgd2l0aCBhbGwgb2YgaXRzIG1hcmt1cCBhbmQgZXZlbnRzIHRvIHRoZSB0YXJnZXRFbFxuXHR0aGlzLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlbGYucHJlbG9hZCgpO1xuXHRcdHNlbGYubG9nKCdSZW5kZXJpbmcuLicpO1xuXHRcdHNlbGYudGFyZ2V0LmFwcGVuZCh0aGlzLmVsKTtcblx0XHRzZWxmLnBvc3Rsb2FkKCk7XG5cdH1cblxuXHR0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0XHRzZWxmLnRhcmdldC5lbXB0eSgpO1xuXHR9XG5cblx0Ly8gQ2FsbCByZW5kZXIgYXV0b21hdGljYWxseSB1cG9uIGNvbnN0cnVjdGlvblxuXHRpZiAodGhpcy5hdXRvUmVuZGVyKSB7XG5cdFx0dGhpcy5yZW5kZXIoKVxuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDtcbiIsIi8qanNsaW50IG9uZXZhcjp0cnVlLCB1bmRlZjp0cnVlLCBuZXdjYXA6dHJ1ZSwgcmVnZXhwOnRydWUsIGJpdHdpc2U6dHJ1ZSwgbWF4ZXJyOjUwLCBpbmRlbnQ6NCwgd2hpdGU6ZmFsc2UsIG5vbWVuOmZhbHNlLCBwbHVzcGx1czpmYWxzZSAqL1xuLypnbG9iYWwgZGVmaW5lOmZhbHNlLCByZXF1aXJlOmZhbHNlLCBleHBvcnRzOmZhbHNlLCBtb2R1bGU6ZmFsc2UsIHNpZ25hbHM6ZmFsc2UgKi9cblxuLyoqIEBsaWNlbnNlXG4gKiBKUyBTaWduYWxzIDxodHRwOi8vbWlsbGVybWVkZWlyb3MuZ2l0aHViLmNvbS9qcy1zaWduYWxzLz5cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogQXV0aG9yOiBNaWxsZXIgTWVkZWlyb3NcbiAqIFZlcnNpb246IDEuMC4wIC0gQnVpbGQ6IDI2OCAoMjAxMi8xMS8yOSAwNTo0OCBQTSlcbiAqL1xuXG4oZnVuY3Rpb24oZ2xvYmFsKXtcblxuICAgIC8vIFNpZ25hbEJpbmRpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICogT2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJpbmRpbmcgYmV0d2VlbiBhIFNpZ25hbCBhbmQgYSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAgICAgKiA8YnIgLz4tIDxzdHJvbmc+VGhpcyBpcyBhbiBpbnRlcm5hbCBjb25zdHJ1Y3RvciBhbmQgc2hvdWxkbid0IGJlIGNhbGxlZCBieSByZWd1bGFyIHVzZXJzLjwvc3Ryb25nPlxuICAgICAqIDxiciAvPi0gaW5zcGlyZWQgYnkgSm9hIEViZXJ0IEFTMyBTaWduYWxCaW5kaW5nIGFuZCBSb2JlcnQgUGVubmVyJ3MgU2xvdCBjbGFzc2VzLlxuICAgICAqIEBhdXRob3IgTWlsbGVyIE1lZGVpcm9zXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQGludGVybmFsXG4gICAgICogQG5hbWUgU2lnbmFsQmluZGluZ1xuICAgICAqIEBwYXJhbSB7U2lnbmFsfSBzaWduYWwgUmVmZXJlbmNlIHRvIFNpZ25hbCBvYmplY3QgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmNlIElmIGJpbmRpbmcgc2hvdWxkIGJlIGV4ZWN1dGVkIGp1c3Qgb25jZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiAoZGVmYXVsdCA9IDApLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNpZ25hbEJpbmRpbmcoc2lnbmFsLCBsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyID0gbGlzdGVuZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGJpbmRpbmcgc2hvdWxkIGJlIGV4ZWN1dGVkIGp1c3Qgb25jZS5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faXNPbmNlID0gaXNPbmNlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAbWVtYmVyT2YgU2lnbmFsQmluZGluZy5wcm90b3R5cGVcbiAgICAgICAgICogQG5hbWUgY29udGV4dFxuICAgICAgICAgKiBAdHlwZSBPYmplY3R8dW5kZWZpbmVkfG51bGxcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGxpc3RlbmVyQ29udGV4dDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVmZXJlbmNlIHRvIFNpZ25hbCBvYmplY3QgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICAgICAqIEB0eXBlIFNpZ25hbFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2lnbmFsID0gc2lnbmFsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0ZW5lciBwcmlvcml0eVxuICAgICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3ByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcbiAgICB9XG5cbiAgICBTaWduYWxCaW5kaW5nLnByb3RvdHlwZSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYmluZGluZyBpcyBhY3RpdmUgYW5kIHNob3VsZCBiZSBleGVjdXRlZC5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYWN0aXZlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBwYXJhbWV0ZXJzIHBhc3NlZCB0byBsaXN0ZW5lciBkdXJpbmcgYFNpZ25hbC5kaXNwYXRjaGAgYW5kIGBTaWduYWxCaW5kaW5nLmV4ZWN1dGVgLiAoY3VycmllZCBwYXJhbWV0ZXJzKVxuICAgICAgICAgKiBAdHlwZSBBcnJheXxudWxsXG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbXMgOiBudWxsLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsIGxpc3RlbmVyIHBhc3NpbmcgYXJiaXRyYXJ5IHBhcmFtZXRlcnMuXG4gICAgICAgICAqIDxwPklmIGJpbmRpbmcgd2FzIGFkZGVkIHVzaW5nIGBTaWduYWwuYWRkT25jZSgpYCBpdCB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBmcm9tIHNpZ25hbCBkaXNwYXRjaCBxdWV1ZSwgdGhpcyBtZXRob2QgaXMgdXNlZCBpbnRlcm5hbGx5IGZvciB0aGUgc2lnbmFsIGRpc3BhdGNoLjwvcD5cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gW3BhcmFtc0Fycl0gQXJyYXkgb2YgcGFyYW1ldGVycyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyXG4gICAgICAgICAqIEByZXR1cm4geyp9IFZhbHVlIHJldHVybmVkIGJ5IHRoZSBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGV4ZWN1dGUgOiBmdW5jdGlvbiAocGFyYW1zQXJyKSB7XG4gICAgICAgICAgICB2YXIgaGFuZGxlclJldHVybiwgcGFyYW1zO1xuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aXZlICYmICEhdGhpcy5fbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSB0aGlzLnBhcmFtcz8gdGhpcy5wYXJhbXMuY29uY2F0KHBhcmFtc0FycikgOiBwYXJhbXNBcnI7XG4gICAgICAgICAgICAgICAgaGFuZGxlclJldHVybiA9IHRoaXMuX2xpc3RlbmVyLmFwcGx5KHRoaXMuY29udGV4dCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNPbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXJSZXR1cm47XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGFjaCBiaW5kaW5nIGZyb20gc2lnbmFsLlxuICAgICAgICAgKiAtIGFsaWFzIHRvOiBteVNpZ25hbC5yZW1vdmUobXlCaW5kaW5nLmdldExpc3RlbmVyKCkpO1xuICAgICAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbnxudWxsfSBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwgb3IgYG51bGxgIGlmIGJpbmRpbmcgd2FzIHByZXZpb3VzbHkgZGV0YWNoZWQuXG4gICAgICAgICAqL1xuICAgICAgICBkZXRhY2ggOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0JvdW5kKCk/IHRoaXMuX3NpZ25hbC5yZW1vdmUodGhpcy5fbGlzdGVuZXIsIHRoaXMuY29udGV4dCkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYmluZGluZyBpcyBzdGlsbCBib3VuZCB0byB0aGUgc2lnbmFsIGFuZCBoYXZlIGEgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBpc0JvdW5kIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICghIXRoaXMuX3NpZ25hbCAmJiAhIXRoaXMuX2xpc3RlbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gSWYgU2lnbmFsQmluZGluZyB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgb25jZS5cbiAgICAgICAgICovXG4gICAgICAgIGlzT25jZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc09uY2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICBnZXRMaXN0ZW5lciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsfSBTaWduYWwgdGhhdCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgYm91bmQgdG8uXG4gICAgICAgICAqL1xuICAgICAgICBnZXRTaWduYWwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2lnbmFsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWxldGUgaW5zdGFuY2UgcHJvcGVydGllc1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2Rlc3Ryb3kgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc2lnbmFsO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2xpc3RlbmVyO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY29udGV4dDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbU2lnbmFsQmluZGluZyBpc09uY2U6JyArIHRoaXMuX2lzT25jZSArJywgaXNCb3VuZDonKyB0aGlzLmlzQm91bmQoKSArJywgYWN0aXZlOicgKyB0aGlzLmFjdGl2ZSArICddJztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4vKmdsb2JhbCBTaWduYWxCaW5kaW5nOmZhbHNlKi9cblxuICAgIC8vIFNpZ25hbCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVMaXN0ZW5lcihsaXN0ZW5lciwgZm5OYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ2xpc3RlbmVyIGlzIGEgcmVxdWlyZWQgcGFyYW0gb2Yge2ZufSgpIGFuZCBzaG91bGQgYmUgYSBGdW5jdGlvbi4nLnJlcGxhY2UoJ3tmbn0nLCBmbk5hbWUpICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgYnJvYWRjYXN0ZXJcbiAgICAgKiA8YnIgLz4tIGluc3BpcmVkIGJ5IFJvYmVydCBQZW5uZXIncyBBUzMgU2lnbmFscy5cbiAgICAgKiBAbmFtZSBTaWduYWxcbiAgICAgKiBAYXV0aG9yIE1pbGxlciBNZWRlaXJvc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNpZ25hbCgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIEFycmF5LjxTaWduYWxCaW5kaW5nPlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYmluZGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IG51bGw7XG5cbiAgICAgICAgLy8gZW5mb3JjZSBkaXNwYXRjaCB0byBhd2F5cyB3b3JrIG9uIHNhbWUgY29udGV4dCAoIzQ3KVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2ggPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgU2lnbmFsLnByb3RvdHlwZS5kaXNwYXRjaC5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIFNpZ25hbC5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNpZ25hbHMgVmVyc2lvbiBOdW1iZXJcbiAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAqIEBjb25zdFxuICAgICAgICAgKi9cbiAgICAgICAgVkVSU0lPTiA6ICcxLjAuMCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIFNpZ25hbCBzaG91bGQga2VlcCByZWNvcmQgb2YgcHJldmlvdXNseSBkaXNwYXRjaGVkIHBhcmFtZXRlcnMgYW5kXG4gICAgICAgICAqIGF1dG9tYXRpY2FsbHkgZXhlY3V0ZSBsaXN0ZW5lciBkdXJpbmcgYGFkZCgpYC9gYWRkT25jZSgpYCBpZiBTaWduYWwgd2FzXG4gICAgICAgICAqIGFscmVhZHkgZGlzcGF0Y2hlZCBiZWZvcmUuXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIG1lbW9yaXplIDogZmFsc2UsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9zaG91bGRQcm9wYWdhdGUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBTaWduYWwgaXMgYWN0aXZlIGFuZCBzaG91bGQgYnJvYWRjYXN0IGV2ZW50cy5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IFNldHRpbmcgdGhpcyBwcm9wZXJ0eSBkdXJpbmcgYSBkaXNwYXRjaCB3aWxsIG9ubHkgYWZmZWN0IHRoZSBuZXh0IGRpc3BhdGNoLCBpZiB5b3Ugd2FudCB0byBzdG9wIHRoZSBwcm9wYWdhdGlvbiBvZiBhIHNpZ25hbCB1c2UgYGhhbHQoKWAgaW5zdGVhZC48L3A+XG4gICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgICovXG4gICAgICAgIGFjdGl2ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XVxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXIgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSkge1xuXG4gICAgICAgICAgICB2YXIgcHJldkluZGV4ID0gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQpLFxuICAgICAgICAgICAgICAgIGJpbmRpbmc7XG5cbiAgICAgICAgICAgIGlmIChwcmV2SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYmluZGluZyA9IHRoaXMuX2JpbmRpbmdzW3ByZXZJbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGJpbmRpbmcuaXNPbmNlKCkgIT09IGlzT25jZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgYWRkJysgKGlzT25jZT8gJycgOiAnT25jZScpICsnKCkgdGhlbiBhZGQnKyAoIWlzT25jZT8gJycgOiAnT25jZScpICsnKCkgdGhlIHNhbWUgbGlzdGVuZXIgd2l0aG91dCByZW1vdmluZyB0aGUgcmVsYXRpb25zaGlwIGZpcnN0LicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYmluZGluZyA9IG5ldyBTaWduYWxCaW5kaW5nKHRoaXMsIGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZEJpbmRpbmcoYmluZGluZyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRoaXMubWVtb3JpemUgJiYgdGhpcy5fcHJldlBhcmFtcyl7XG4gICAgICAgICAgICAgICAgYmluZGluZy5leGVjdXRlKHRoaXMuX3ByZXZQYXJhbXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtTaWduYWxCaW5kaW5nfSBiaW5kaW5nXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfYWRkQmluZGluZyA6IGZ1bmN0aW9uIChiaW5kaW5nKSB7XG4gICAgICAgICAgICAvL3NpbXBsaWZpZWQgaW5zZXJ0aW9uIHNvcnRcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICAgICAgZG8geyAtLW47IH0gd2hpbGUgKHRoaXMuX2JpbmRpbmdzW25dICYmIGJpbmRpbmcuX3ByaW9yaXR5IDw9IHRoaXMuX2JpbmRpbmdzW25dLl9wcmlvcml0eSk7XG4gICAgICAgICAgICB0aGlzLl9iaW5kaW5ncy5zcGxpY2UobiArIDEsIDAsIGJpbmRpbmcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfaW5kZXhPZkxpc3RlbmVyIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBjdXI7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgY3VyID0gdGhpcy5fYmluZGluZ3Nbbl07XG4gICAgICAgICAgICAgICAgaWYgKGN1ci5fbGlzdGVuZXIgPT09IGxpc3RlbmVyICYmIGN1ci5jb250ZXh0ID09PSBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgaWYgbGlzdGVuZXIgd2FzIGF0dGFjaGVkIHRvIFNpZ25hbC5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XVxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBpZiBTaWduYWwgaGFzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBoYXMgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGNvbnRleHQpICE9PSAtMTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGEgbGlzdGVuZXIgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgU2lnbmFsIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gW3ByaW9yaXR5XSBUaGUgcHJpb3JpdHkgbGV2ZWwgb2YgdGhlIGV2ZW50IGxpc3RlbmVyLiBMaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBleGVjdXRlZCBiZWZvcmUgbGlzdGVuZXJzIHdpdGggbG93ZXIgcHJpb3JpdHkuIExpc3RlbmVycyB3aXRoIHNhbWUgcHJpb3JpdHkgbGV2ZWwgd2lsbCBiZSBleGVjdXRlZCBhdCB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgYWRkZWQuIChkZWZhdWx0ID0gMClcbiAgICAgICAgICogQHJldHVybiB7U2lnbmFsQmluZGluZ30gQW4gT2JqZWN0IHJlcHJlc2VudGluZyB0aGUgYmluZGluZyBiZXR3ZWVuIHRoZSBTaWduYWwgYW5kIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAnYWRkJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihsaXN0ZW5lciwgZmFsc2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgbGlzdGVuZXIgdG8gdGhlIHNpZ25hbCB0aGF0IHNob3VsZCBiZSByZW1vdmVkIGFmdGVyIGZpcnN0IGV4ZWN1dGlvbiAod2lsbCBiZSBleGVjdXRlZCBvbmx5IG9uY2UpLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBTaWduYWwgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIExpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGV4ZWN1dGVkIGJlZm9yZSBsaXN0ZW5lcnMgd2l0aCBsb3dlciBwcmlvcml0eS4gTGlzdGVuZXJzIHdpdGggc2FtZSBwcmlvcml0eSBsZXZlbCB3aWxsIGJlIGV4ZWN1dGVkIGF0IHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSBhZGRlZC4gKGRlZmF1bHQgPSAwKVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfSBBbiBPYmplY3QgcmVwcmVzZW50aW5nIHRoZSBiaW5kaW5nIGJldHdlZW4gdGhlIFNpZ25hbCBhbmQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBhZGRPbmNlIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAnYWRkT25jZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXIobGlzdGVuZXIsIHRydWUsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYSBzaW5nbGUgbGlzdGVuZXIgZnJvbSB0aGUgZGlzcGF0Y2ggcXVldWUuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIEhhbmRsZXIgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgcmVtb3ZlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSBFeGVjdXRpb24gY29udGV4dCAoc2luY2UgeW91IGNhbiBhZGQgdGhlIHNhbWUgaGFuZGxlciBtdWx0aXBsZSB0aW1lcyBpZiBleGVjdXRpbmcgaW4gYSBkaWZmZXJlbnQgY29udGV4dCkuXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBMaXN0ZW5lciBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlIDogZnVuY3Rpb24gKGxpc3RlbmVyLCBjb250ZXh0KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCAncmVtb3ZlJyk7XG5cbiAgICAgICAgICAgIHZhciBpID0gdGhpcy5faW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzW2ldLl9kZXN0cm95KCk7IC8vbm8gcmVhc29uIHRvIGEgU2lnbmFsQmluZGluZyBleGlzdCBpZiBpdCBpc24ndCBhdHRhY2hlZCB0byBhIHNpZ25hbFxuICAgICAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZnJvbSB0aGUgU2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlQWxsIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAobi0tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Nbbl0uX2Rlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLmxlbmd0aCA9IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gTnVtYmVyIG9mIGxpc3RlbmVycyBhdHRhY2hlZCB0byB0aGUgU2lnbmFsLlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TnVtTGlzdGVuZXJzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RvcCBwcm9wYWdhdGlvbiBvZiB0aGUgZXZlbnQsIGJsb2NraW5nIHRoZSBkaXNwYXRjaCB0byBuZXh0IGxpc3RlbmVycyBvbiB0aGUgcXVldWUuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBzaG91bGQgYmUgY2FsbGVkIG9ubHkgZHVyaW5nIHNpZ25hbCBkaXNwYXRjaCwgY2FsbGluZyBpdCBiZWZvcmUvYWZ0ZXIgZGlzcGF0Y2ggd29uJ3QgYWZmZWN0IHNpZ25hbCBicm9hZGNhc3QuPC9wPlxuICAgICAgICAgKiBAc2VlIFNpZ25hbC5wcm90b3R5cGUuZGlzYWJsZVxuICAgICAgICAgKi9cbiAgICAgICAgaGFsdCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaC9Ccm9hZGNhc3QgU2lnbmFsIHRvIGFsbCBsaXN0ZW5lcnMgYWRkZWQgdG8gdGhlIHF1ZXVlLlxuICAgICAgICAgKiBAcGFyYW0gey4uLip9IFtwYXJhbXNdIFBhcmFtZXRlcnMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIGVhY2ggaGFuZGxlci5cbiAgICAgICAgICovXG4gICAgICAgIGRpc3BhdGNoIDogZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKCEgdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwYXJhbXNBcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgICAgIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYmluZGluZ3M7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1lbW9yaXplKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IHBhcmFtc0FycjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCEgbikge1xuICAgICAgICAgICAgICAgIC8vc2hvdWxkIGNvbWUgYWZ0ZXIgbWVtb3JpemVcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJpbmRpbmdzID0gdGhpcy5fYmluZGluZ3Muc2xpY2UoKTsgLy9jbG9uZSBhcnJheSBpbiBjYXNlIGFkZC9yZW1vdmUgaXRlbXMgZHVyaW5nIGRpc3BhdGNoXG4gICAgICAgICAgICB0aGlzLl9zaG91bGRQcm9wYWdhdGUgPSB0cnVlOyAvL2luIGNhc2UgYGhhbHRgIHdhcyBjYWxsZWQgYmVmb3JlIGRpc3BhdGNoIG9yIGR1cmluZyB0aGUgcHJldmlvdXMgZGlzcGF0Y2guXG5cbiAgICAgICAgICAgIC8vZXhlY3V0ZSBhbGwgY2FsbGJhY2tzIHVudGlsIGVuZCBvZiB0aGUgbGlzdCBvciB1bnRpbCBhIGNhbGxiYWNrIHJldHVybnMgYGZhbHNlYCBvciBzdG9wcyBwcm9wYWdhdGlvblxuICAgICAgICAgICAgLy9yZXZlcnNlIGxvb3Agc2luY2UgbGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgYWRkZWQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdFxuICAgICAgICAgICAgZG8geyBuLS07IH0gd2hpbGUgKGJpbmRpbmdzW25dICYmIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSAmJiBiaW5kaW5nc1tuXS5leGVjdXRlKHBhcmFtc0FycikgIT09IGZhbHNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9yZ2V0IG1lbW9yaXplZCBhcmd1bWVudHMuXG4gICAgICAgICAqIEBzZWUgU2lnbmFsLm1lbW9yaXplXG4gICAgICAgICAqL1xuICAgICAgICBmb3JnZXQgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5fcHJldlBhcmFtcyA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgYmluZGluZ3MgZnJvbSBzaWduYWwgYW5kIGRlc3Ryb3kgYW55IHJlZmVyZW5jZSB0byBleHRlcm5hbCBvYmplY3RzIChkZXN0cm95IFNpZ25hbCBvYmplY3QpLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gY2FsbGluZyBhbnkgbWV0aG9kIG9uIHRoZSBzaWduYWwgaW5zdGFuY2UgYWZ0ZXIgY2FsbGluZyBkaXNwb3NlIHdpbGwgdGhyb3cgZXJyb3JzLjwvcD5cbiAgICAgICAgICovXG4gICAgICAgIGRpc3Bvc2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2JpbmRpbmdzO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3ByZXZQYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnW1NpZ25hbCBhY3RpdmU6JysgdGhpcy5hY3RpdmUgKycgbnVtTGlzdGVuZXJzOicrIHRoaXMuZ2V0TnVtTGlzdGVuZXJzKCkgKyddJztcbiAgICAgICAgfVxuXG4gICAgfTtcblxuXG4gICAgLy8gTmFtZXNwYWNlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiBTaWduYWxzIG5hbWVzcGFjZVxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbmFtZSBzaWduYWxzXG4gICAgICovXG4gICAgdmFyIHNpZ25hbHMgPSBTaWduYWw7XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b20gZXZlbnQgYnJvYWRjYXN0ZXJcbiAgICAgKiBAc2VlIFNpZ25hbFxuICAgICAqL1xuICAgIC8vIGFsaWFzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSAoc2VlICNnaC00NClcbiAgICBzaWduYWxzLlNpZ25hbCA9IFNpZ25hbDtcblxuXG5cbiAgICAvL2V4cG9ydHMgdG8gbXVsdGlwbGUgZW52aXJvbm1lbnRzXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKXsgLy9BTURcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNpZ25hbHM7IH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpeyAvL25vZGVcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzaWduYWxzO1xuICAgIH0gZWxzZSB7IC8vYnJvd3NlclxuICAgICAgICAvL3VzZSBzdHJpbmcgYmVjYXVzZSBvZiBHb29nbGUgY2xvc3VyZSBjb21waWxlciBBRFZBTkNFRF9NT0RFXG4gICAgICAgIC8qanNsaW50IHN1Yjp0cnVlICovXG4gICAgICAgIGdsb2JhbFsnc2lnbmFscyddID0gc2lnbmFscztcbiAgICB9XG5cbn0odGhpcykpO1xuIl19
