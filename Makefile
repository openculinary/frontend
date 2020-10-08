.PHONY: build-dev build lint tests

SERVICE=$(shell basename $(shell git rev-parse --show-toplevel))
REGISTRY=registry.openculinary.org
PROJECT=reciperadar

IMAGE_NAME=${REGISTRY}/${PROJECT}/${SERVICE}
IMAGE_COMMIT := $(shell git rev-parse --short HEAD)
IMAGE_TAG := $(strip $(if $(shell git status --porcelain --untracked-files=no), latest, ${IMAGE_COMMIT}))

MODE = 'development'
build : MODE = 'production'

build-dev: image-create webpack-dev image-finalize

build: lint tests image-create webpack image-finalize

deploy:
	kubectl apply -f k8s
	kubectl set image deployments -l app=${SERVICE} ${SERVICE}=${IMAGE_NAME}:${IMAGE_TAG}

image-create:
	$(eval container=$(shell buildah from docker.io/library/nginx:alpine))
	buildah copy $(container) 'etc/nginx/conf.d' '/etc/nginx/conf.d'

image-finalize:
	buildah copy $(container) 'public' '/usr/share/nginx/html'
	buildah config --port 80 --entrypoint '/usr/sbin/nginx -g "daemon off;"' $(container)
	buildah commit --squash --rm $(container) ${IMAGE_NAME}:${IMAGE_TAG}

lint:
	npx eslint src

tests:
	npx mochapack --mode ${MODE} --require setup.js --include test/utils/db-hooks.ts

webpack:
	npx webpack --mode ${MODE} --optimize-minimize

webpack-dev:
	npx webpack --mode ${MODE}
