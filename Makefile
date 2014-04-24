build:
	browserify js/main.js > js/main_build.js
	minify js/main_build.js js/main_build.min.js
	minify css/style.css css/style.min.css
