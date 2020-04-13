.PHONY: build-dev build lint tests

build-dev:
	webpack

build: lint tests
	webpack --mode production --optimize-minimize

lint:
	eslint src

tests:
	mochapack --mode development --require setup.js
