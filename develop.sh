HOSTNAME=$(hostname)
REPO_PATH=$(git rev-parse --show-toplevel)

kubectl delete -f k8s/development
cat k8s/development/*.yml \
  | sed -e "s|HOSTNAME|${HOSTNAME}|g" \
  | sed -e "s|REPO_PATH|${REPO_PATH}|g" \
  | kubectl create -f -
kubectl patch deployment frontend-deployment --patch "$(cat k8s/development/web-deployment.yml.patch)"
