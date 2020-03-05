.PHONY: prebuild lint tests

prebuild: lint tests
	webpack -p --optimize-minimize

lint:
	eslint src

score:
	lhci autorun

tests:
	mochapack --require setup.js
