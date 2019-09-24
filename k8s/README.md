# frontend

## Install dependencies

```
wget -qO - https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key-add -
echo 'deb http://apt.kubernetes.io/ kubernetes-xenial main' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt install \
  cri-o-1.15 \
  flannel \
  kubeadm
```

## Configure cgroup management for crio
```
sudo vim /etc/crio/crio.conf
...
cgroup_manager = "cgroupfs"
```

## Initialize a kubernetes cluster
```
sudo kubeadm init --apiserver-advertise-address=192.168.100.1 --pod-network-cidr=192.168.100.0/24
```

## Configure kubectl user access
```
mkdir -p ~/.kube/
sudo cp /etc/kubernetes/admin.conf ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
```

## Configure pod networking and ingress
```
kubectl apply -f cni/calico.yaml
kubectl apply -f ingress/nginx-ingress-controller.yaml
kubectl apply -f ingress/nginx-ingress-service.yaml
```

# Allow scheduling of application workloads on master
```
kubectl taint nodes point node-role.kubernetes.io/master:NoSchedule-
kubectl label nodes point app=frontend
```

## Deploy the application
```
kubectl create -f frontend-deployment.yml
kubectl create -f frontend-service.yml
kubectl create -f frontend-ingress.yml
kubectl set image deployment/frontend-deployment frontend=registry.gitlab.com/openculinary/frontend:$(git rev-parse --short HEAD)
```

## Make a smoke test request to the application
```
PORT=$(kubectl -n ingress-nginx get svc --no-headers -o custom-columns=port:spec.ports[*].nodePort)
curl -H 'Host: frontend' localhost:${PORT}
```
