.PHONY: prebuild lint tests

prebuild: lint tests
	yarnpkg run webpack -p --optimize-minimize

lint:
	yarnpkg run eslint src

tests:
	yarnpkg run mochapack --require setup.js
