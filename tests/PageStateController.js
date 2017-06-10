const PageStateController = require('../js/PageStateController.js')
const PageController = require('../js/PageController.js')

describe('PageStateController', function() {

		beforeAll(function() {

		});

		it('should construct', function() {
			// Activate page controller
			thePageController = new PageController();
			thePageStateController = new PageStateController({
				activePageController: thePageController,
				eventName: 'stateChange'
			});

			didStateChangeEvent = false;
			$(document.body).on(thePageStateController.eventName, function(e, oldState, newState) {
				didStateChangeEvent = true;
			})

			expect(thePageStateController instanceof PageStateController).toBe(true)
    });

		it('should keep an up-to-date active page on document ready', function(done) {
			$(document).ready(function() {
				expect(thePageStateController.activePage.length > 0).toBe(true);
				done()
			});
    });

		it('should keep an up-to-date active page by tracking location update', function(done) {
			var newPage = "#justin"
			window.location = newPage;
			window.setTimeout(function () {
				expect(thePageStateController.activePage.indexOf(newPage) > -1).toBe(true);
				done()
			}, 10);
    });

		it('should keep an up-to-date active page by tracking history push states', function(done) {
			var newPage = "#justin"
			history.pushState({}, "", newPage);
			window.setTimeout(function () {
				expect(thePageStateController.activePage.indexOf(newPage) > -1).toBe(true);
				done()
			}, 10);
    });

		it('should activate the active page controller with the latest page name', function() {
			var newPage = "#justin"
			expect(thePageController.pageName.indexOf(newPage) > -1).toBe(true)
    });

		it('should trigger the event', function() {
			expect(didStateChangeEvent).toBe(true)
    });

		it('should be able to preprocess the active page using only the hash if you want', function() {
			var newPage = "bieber"+Math.round(Math.random()*100)
			thePageStateController.preprocessActivePage = function(activePage) {
				activePage = window.location.hash.replace('#!', '').replace('#', '')
				console.log('Preprocessing active page:' , activePage)
				return activePage;
			}
			window.location.hash = newPage;
			expect(thePageStateController.activePage).toBe(newPage);
    });

		afterAll(function() {

		});

});
