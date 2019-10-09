REGISTRY='registry.gitlab.com'
PROJECT='openculinary'

IMAGE_NAME=${REGISTRY}/${PROJECT}/$(basename `git rev-parse --show-toplevel`)
IMAGE_COMMIT=$(git rev-parse --short HEAD)

if [ -n "${GITLAB_USER_ID}" ]; then
    # Override the default 'overlay' storage driver, which fails GitLab builds
    export STORAGE_DRIVER='vfs'

    # Workaround from https://major.io for 'overlay.mountopt' option conflict
    sed -i '/^mountopt =.*/d' /etc/containers/storage.conf

    # Authenticate for any privileged operations
    REGISTRY_AUTH_FILE=${HOME}/auth.json echo "${CI_REGISTRY_PASSWORD}" | buildah login -u "${CI_REGISTRY_USER}" --password-stdin ${CI_REGISTRY}
fi

container=$(buildah from docker.io/library/nginx:alpine)
buildah copy ${container} 'html' '/usr/share/nginx/html'
buildah config --port 80 --entrypoint '/usr/sbin/nginx -g "daemon off;"' ${container}
buildah commit --squash --rm ${container} ${IMAGE_NAME}:${IMAGE_COMMIT}

if [ -n "${GITLAB_USER_ID}" ]; then
    buildah push ${IMAGE_NAME}:${IMAGE_COMMIT}
fi
