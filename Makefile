prebuild: lint tests
	yarnpkg run webpack -p --optimize-minimize

install:
	yarnpkg install

lint: install
	yarnpkg run eslint src

tests: install
	yarnpkg run mochapack --require setup.js
