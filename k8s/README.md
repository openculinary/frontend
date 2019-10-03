# frontend

## Install dependencies

```
wget -qO - https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo 'deb http://apt.kubernetes.io/ kubernetes-xenial main' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo add-apt-repository ppa:projectatomic/ppa
sudo apt install \
  cri-o-1.15 \
  kubeadm
sudo systemctl enable crio.service
sudo systemctl restart crio.service
```

## Configure cgroup management for crio
```
sudo vim /etc/crio/crio.conf
...
cgroup_manager = "cgroupfs"
```

# Enable ipv4 packet forwarding
```
sudo vim /etc/sysctl.d/99-sysctl.conf
...
net.ipv4.ip_forward=1
...
sudo sysctl --system
```

# Install required kernel modules
```
echo br_netfilter >> /etc/modules
echo dummy >> /etc/modules
```

# Create a persistent dummy network interface
```
sudo vim /etc/systemd/network/10-dummy0.netdev
...
[NetDev]
Name=dummy0
Kind=dummy
...
sudo vim /etc/systemd/network/20-dummy0.network
...
[Match]
Name=dummy0

[Network]
Address=192.168.100.1
...
sudo systemctl restart systemd-networkd
```

## Initialize a kubernetes cluster
```
sudo kubeadm init --apiserver-advertise-address=192.168.100.1 --pod-network-cidr=192.168.100.0/24
```

## Configure kubectl user access
```
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## Configure pod networking and ingress
```
kubectl apply -f cni/calico.yaml
kubectl apply -f ingress/nginx-ingress-controller.yaml
kubectl apply -f ingress/nginx-ingress-service.yaml
```

# Allow scheduling of application workloads on master
```
kubectl taint nodes `hostname` node-role.kubernetes.io/master:NoSchedule-
kubectl label nodes `hostname` app=frontend
```

## Add read-only credentials to enable pulling new images
```
kubectl create secret docker-registry gitlab-registry \
    --docker-server registry.gitlab.com \
    --docker-username <username> \
    --docker-password <password>
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
curl -4 -H 'Host: frontend' localhost:${PORT}
```
