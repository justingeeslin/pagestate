var PageController = function() {
  var self = this;

  this.pageName = '';

  this.go = function(page) {
    self.pageName = page;
  }

  return this;
}
module.exports = PageController;
