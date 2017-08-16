const extend = require('extend')
const Component = require('sensible-component')

var Page7525 = function( options ) {
  var self = this;
  var defaults {

  };

  self = extend(self, defaults);
  self = extend(self, options);
  self = extend(self, new Component(self));

  this.stateChange = function(oldState, newState) {

  }

  // Build the Columns. One 75%; the other 25%;
  var col9 = $'<div id="col-9"></div>');
  target.append(col9)
  var col3 = $('<div id="col-3"></div>')
  target.append(col3)

  // Add a few headings for testing purposes
  col9.append('<h1 id="one">Heading One</h1>')
  col9.append('<h1 id="two">Heading Two</h1>')

  return this;
}

module.exports = Page7525
