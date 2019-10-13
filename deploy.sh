SERVICE=$(basename `git rev-parse --show-toplevel`)
COMMIT=$(git rev-parse --short HEAD)

kubectl delete -f k8s

if [ ! -n "${GITLAB_USER_ID}" ]; then
    HOSTNAME=$(hostname)
    REPO_PATH=$(git rev-parse --show-toplevel)

    kubectl delete -f k8s/development
    cat k8s/development/*.yml \
      | sed -e "s|HOSTNAME|${HOSTNAME}|g" \
      | sed -e "s|REPO_PATH|${REPO_PATH}|g" \
      | kubectl create -f -
fi

kubectl create -f k8s
kubectl set image deployments -l app=${SERVICE} ${SERVICE}=registry.gitlab.com/openculinary/${SERVICE}:${COMMIT}

if [ ! -n "${GITLAB_USER_ID}" ]; then
    for patch in k8s/development/*.patch; do
        kubectl patch -f k8s/`basename ${patch} .patch` --patch "$(cat ${patch})"
    done
fi
