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

		it('should call a postload event on construction', function(done) {
			isCalled = false;

			$(document.body).on('postload.sensible', function() {
				isCalled = true;
				expect(isCalled).toBe(true)
				done()
			})
			
			var thePage = new Page({});

    });

		it('should scroll to an element when there is a fragment (ID Selector)', function() {

			$(document.body).append('<div id="content"></div>');

			$('#content').append('<h1 id="one">Heading One</h1>')
			$('#content').append('<h1 id="two">Heading Two</h1>')
			// Make sure the page is scrollable
			$('#content').append('<h1 id="three" style="margin-bottom:100em;">Heading Three</h1>')

			thePage = new Page({
				target: $("#content"),
				debug: true
			});

			thePage.state = 'contactus#two';

			expect($(window).scrollTop()).toBe(79);
    });

		it('should scroll to an element when there is a fragment (Paragraph Integer)', function() {

			$(document.body).append('<div id="content"></div>');

			$('#content').append('<p id="one">Paragraph One</p>')
			$('#content').append('<p id="two">Paragraph Two</p>')
			// Make sure the page is scrollable
			$('#content').append('<p id="three" style="margin-bottom:100em;">Paragraph Three</p>')

			thePage = new Page({
				target: $("#content"),
				debug: true
			});

			thePage.state = 'contactus#2';

			expect($(window).scrollTop()).toBe(3443);

    });

});
