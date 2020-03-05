.PHONY: prebuild lint tests

prebuild: lint tests
	webpack

lint:
	eslint src

score:
	lhci autorun

tests:
	mochapack --require setup.js
