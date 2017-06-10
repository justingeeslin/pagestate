const extend = require('extend');

var PageStateController = function( options ) {
  var self = this;

  var defaults = {
    target: 'body',
    //
    activePageController: undefined,
    // A string which is the location minus the domain and protocol. Only path and hash.
    activePage: '',
    preprocessActivePage: function(location) {
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

  this.go = function() {
    var oldState = self.activePage;
    self.activePage = self.preprocessActivePage(window.location.pathname + window.location.hash);
    var newState = self.activePage;
    if (self.activePageController) {
      self.activePageController.go(self.activePage)
    }
    if (self.eventName) {
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
