const extend = require('extend')
const Component = require('sensible-component')

var Page = function( options ) {
  var self = this;

  var defaults = {
    // Title of the page. Appears in history, bookmarks, and tabs
    title: "",
    // Suffix like the name of the app, etc.
    suffix: "",
  }

  self = extend(self, defaults);
  self = extend(self, options);

  self = extend(self, new Component(self));

  var setTitle = function(title) {
    self.log('Setting the title');
    window.location.title = title + suffix;
  }

  this.stateChange = function(page) {
    // Call parent go.
    self._super.go()

    // Set title
    setTitle(self.title)
  }

  return this;
}
module.exports = Page;
