.PHONY: build-dev build deploy image image-create webpack license-check image-finalize lint tests

SERVICE=$(shell basename $(shell git rev-parse --show-toplevel))
REGISTRY=registry.openculinary.org
PROJECT=reciperadar

IMAGE_NAME=${REGISTRY}/${PROJECT}/${SERVICE}
IMAGE_COMMIT := $(shell git rev-parse HEAD)
IMAGE_TAG := $(strip $(if $(shell git status --porcelain --untracked-files=no), latest, ${IMAGE_COMMIT}))

MODE = 'development'
build : MODE = 'production'

build-dev: image
build: image

deploy:
	kubectl apply -f k8s
	kubectl set image deployments -l app=${SERVICE} ${SERVICE}=${IMAGE_NAME}:${IMAGE_TAG}

image: image-create webpack license-check image-finalize

image-create:
	$(eval container=$(shell buildah from docker.io/library/nginx:alpine))
	buildah copy $(container) 'etc/nginx' '/etc/nginx'

webpack:
	(test -f public/reciperadar.webmanifest && rm -rf public) || true
	npx webpack --mode ${MODE}

license-check:
	$(eval licenses=$(shell jq --raw-output ".dependencies | keys | .[]" "package.json" | grep --file - --line-regexp "public/licenses.txt" | wc --lines))
	$(eval packages=$(shell jq --raw-output ".dependencies | keys | .[]" "package.json" | wc --lines))
	@if [ "${licenses}" -ne "${packages}" ]; then echo "error: only ${licenses} of ${packages} top-level dependencies found in licenses.txt"; exit 1; fi;
	$(eval references=$(shell grep --count '"licenses.txt"' "public/index.html"))
	$(eval checksums=$(shell grep --count $(shell openssl dgst -sha512 -binary "public/licenses.txt" | base64 --wrap 0) "public/index.html"))
	@if [ "${references}" -ne "${checksums}" ]; then echo "error: expected ${references} licenses.txt checksums in index.html but found ${checksums}"; exit 1; fi;

image-finalize:
	sed --expression 's#integrity="sha512"#integrity="sha512-$(shell openssl dgst -sha512 -binary "public/sw.js" | base64 --wrap 0)"#' --in-place 'public/index.html'
	buildah copy $(container) 'public' '/usr/share/nginx/html/reciperadar'
	buildah config --cmd '/usr/sbin/nginx -g "daemon off;"' --port 80 $(container)
	buildah commit --omit-timestamp --quiet --rm --squash $(container) ${IMAGE_NAME}:${IMAGE_TAG}

lint:
	npx eslint src

tests:
	npx mocha --mode ${MODE} --require setup.mjs --require ts-node/register 'src/**/*.spec.ts'
