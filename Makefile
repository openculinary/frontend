.PHONY: build-dev build lint tests

MODE = 'development'
build : MODE = 'production'

build-dev:
	webpack --mode ${MODE}

build: lint tests
	webpack --mode ${MODE} --optimize-minimize

lint:
	eslint src

tests:
	mochapack --mode ${MODE} --require setup.js
