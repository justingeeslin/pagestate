const extend = require('extend');

var PageStateController = function( options ) {
  var self = this;

  var defaults = {
    target: 'body',
    //
    activePageController: undefined,
    // A string which is the location minus the domain and protocol. Only path and hash.
    activePage: ''
  }

  self = extend(self, defaults)
  self = extend(self, options)

  this.targetEl = $(this.target);

  $(window).on('popstate', function() {
    console.log('Pop State fired!');
    // self.activePage = window.location.href.replace(window.location.origin, '');
    self.activePage = window.location.pathname + window.location.hash
    if (self.activePageController) {
      self.activePageController.go(self.activePage)
    }
  });

  return this;
}

module.exports = PageStateController;
