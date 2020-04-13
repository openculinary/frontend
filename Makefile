.PHONY: build-dev build lint tests

build-dev:
	webpack

build: lint tests
	webpack -p

lint:
	eslint src

tests:
	mochapack --mode development --require setup.js
