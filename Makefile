.PHONY: build-dev build deploy image image-create webpack image-finalize lint tests

SERVICE=$(shell basename $(shell git rev-parse --show-toplevel))
REGISTRY=registry.openculinary.org
PROJECT=reciperadar

IMAGE_NAME=${REGISTRY}/${PROJECT}/${SERVICE}
IMAGE_COMMIT := $(shell git rev-parse --short HEAD)
IMAGE_TAG := $(strip $(if $(shell git status --porcelain --untracked-files=no), latest, ${IMAGE_COMMIT}))

MODE = 'development'
build : MODE = 'production'

build-dev: image
build: image

deploy:
	kubectl apply -f k8s
	kubectl set image deployments -l app=${SERVICE} ${SERVICE}=${IMAGE_NAME}:${IMAGE_TAG}

image: image-create webpack image-finalize

image-create:
	$(eval container=$(shell buildah from docker.io/library/nginx:alpine))
	buildah copy $(container) 'etc/nginx/conf.d' '/etc/nginx/conf.d'
	buildah run --network none $(container) -- rm -rf '/usr/share/nginx/html' --

webpack:
	(test -f public/reciperadar.webmanifest && rm -rf public) || true
	yarnpkg run webpack --mode ${MODE}

image-finalize:
	buildah copy $(container) 'public' '/usr/share/nginx/html'
	buildah config --cmd '/usr/sbin/nginx -g "daemon off;"' --port 80 $(container)
	buildah commit --quiet --rm --squash $(container) ${IMAGE_NAME}:${IMAGE_TAG}

lint:
	yarnpkg run eslint src

tests: webpack
	yarnpkg run mocha --mode ${MODE} --require setup.mjs --require ts-node/register 'src/**/*.spec.ts'
