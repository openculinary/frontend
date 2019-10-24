REGISTRY='registry.openculinary.org'
PROJECT='reciperadar'
SERVICE=$(basename `git rev-parse --show-toplevel`)

IMAGE_NAME=${REGISTRY}/${PROJECT}/${SERVICE}
IMAGE_COMMIT=$(git rev-parse --short HEAD)

container=$(buildah from docker.io/library/nginx:alpine)
buildah copy ${container} 'etc/nginx/conf.d' '/etc/nginx/conf.d'
buildah copy ${container} 'public' '/usr/share/nginx/html'
buildah config --port 80 --entrypoint '/usr/sbin/nginx -g "daemon off;"' ${container}
buildah commit --squash --rm ${container} ${IMAGE_NAME}:${IMAGE_COMMIT}
