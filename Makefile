.PHONY: build-dev build lint tests

build-dev:
	webpack

build: lint tests
	webpack -p --optimize-minimize

lint:
	eslint src

tests:
	mochapack --require setup.js
