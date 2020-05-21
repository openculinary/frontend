.PHONY: build-dev build lint tests

MODE = 'development'
build : MODE = 'production'

build-dev:
	npx webpack --mode ${MODE}

build: lint tests
	npx webpack --mode ${MODE} --optimize-minimize

lint:
	npx eslint src

tests:
	npx mochapack --mode ${MODE} --require setup.js
