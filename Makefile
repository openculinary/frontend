.PHONY: build lint tests

build: lint tests
	webpack -p --optimize-minimize

lint:
	eslint src

tests:
	mochapack --require setup.js
