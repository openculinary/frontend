IMAGE_NAME='frontend'
IMAGE_COMMIT=$(git rev-parse --short HEAD)

container=$(buildah from docker.io/library/nginx:latest)
buildah copy ${container} 'html' '/usr/share/nginx/html'
buildah config --port 80 --entrypoint '/usr/sbin/nginx -g "daemon off;"' ${container}
buildah commit --squash --rm ${container} ${IMAGE_NAME}:${IMAGE_COMMIT}
