const crossroads = require('crossroads');
const extend = require('extend');

var PageStateController = function( options ) {
  var self = this;

  var defaults = {
    target: 'body',
    state: '',
    routes: {},
    shouldWatchLocation: true,
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

  var router = crossroads.create();
  // Cast "undefined" strings as literal undefined
  router.shouldTypecast = true
  // Allow the same route to run twice
  router.ignoreState = true

  // Add the routes to crossroads.
  for(var r in this.routes) {
    this.log('Added route for: ', r);
    router.addRoute(r, this.routes[r]);
  }

  this.go = function(state) {;
    var oldState = self.state;
    self.state = self.preprocessState(state);
    var newState = self.state;

    if (self.state == '') {
      self.log('Page State Controller going with an empty state. Exiting..');
      return;
    }

    // Perform Routes Actions.
    self.log('Parsing Route: ' + self.state)
    router.parse(self.state);


    if (typeof self.eventName !== "undefined") {
      $(document.body).trigger(self.eventName, [oldState, newState] );
    }
  }

  if (this.shouldWatchLocation) {
    var state = function() {
      return window.location.pathname + window.location.hash
    };

    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent) || navigator.userAgent.indexOf("Trident/") > -1 ) {
      $(window).on('hashchange', function() {
        self.log('Hash Change fired!');
        self.go(state());
      });
    }
    else {
      $(window).on('popstate', function() {
        self.log('Pop State fired!');
        self.go(state());
      });
    }

    if (document.readyState === 'complete') {
      self.log('Document ready.');
      self.go(state());
    }
    else {
      $(document).ready(function() {
        self.log('Document ready.');
        self.go(state());
      });
    }
  }

  return this;
}

module.exports = PageStateController;
