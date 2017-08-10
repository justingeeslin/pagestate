const Page = require('../js/Page.js')

describe('Page', function() {

		beforeAll(function() {

		});

		it('should construct', function() {
			var thePage = new Page();

			expect(thePage instanceof Page).toBe(true)
    });

		it('should set title on construction', function() {
			var thePage = new Page({
				title: "My First Page"
			});

			expect(document.title).toBe("My First Page")
    });

		it('should set suffix on construction', function() {
			var thePage = new Page({
				title: "My First Page",
				suffix: " - A Sensible Application"
			});

			expect(document.title).toBe("My First Page - A Sensible Application")
    });

		it('should call a postload callback', function(done) {
			isCalled = false;
			var thePage = new Page({
				postload: function() {
					isCalled = true;
					expect(isCalled).toBe(true)
					done()
				}
			});

    });

		it('should scroll to an element when there is a fragment', function() {

			$(document.body).append('<div id="content"></div>');

			$('#content').append('<h1 id="one">Heading One</h1>')
			$('#content').append('<h1 id="two">Heading Two</h1>')
			// Make sure the page is scrollable
			$('#content').append('<h1 id="three" style="margin-bottom:10000em;">Heading Three</h1>')

			thePage = new Page({
				target: $("#content"),
				debug: true
			});

			thePage.state = 'contactus#two';

			expect($(window).scrollTop()).not.toBe(0);

    });

});
