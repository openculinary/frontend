IMAGE_NAME='registry.gitlab.com/openculinary/frontend'
IMAGE_COMMIT=$(git rev-parse --short HEAD)

if [ -n "${GITLAB_USER_ID}" ]; then
    # Override the default 'overlay' storage driver, which fails GitLab builds
    export STORAGE_DRIVER='vfs'

    # Workaround from https://major.io for 'overlay.mountopt' option conflict
    sed -i '/^mountopt =.*/d' /etc/containers/storage.conf
fi

container=$(buildah from docker.io/library/nginx:latest)
buildah copy ${container} 'html' '/usr/share/nginx/html'
buildah config --port 80 --entrypoint '/usr/sbin/nginx -g "daemon off;"' ${container}
buildah commit --squash --rm ${container} ${IMAGE_NAME}:${IMAGE_COMMIT}

if [ -n "${GITLAB_USER_ID}" ]; then
    REGISTRY_AUTH_FILE=${HOME}/auth.json echo "${CI_REGISTRY_PASSWORD}" | buildah login -u "${CI_REGISTRY_USER}" --password-stdin ${CI_REGISTRY}
    buildah push ${IMAGE_NAME}:${IMAGE_COMMIT}
fi
