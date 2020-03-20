.PHONY: prebuild lint tests

prebuild: lint tests
	webpack -p --optimize-minimize

lint:
	eslint src

tests:
	mochapack --require setup.js
