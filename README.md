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
sudo kubeadm init --apiserver-advertise-address=192.168.100.1 --pod-network-cidr=10.244.0.0/16
```

## Configure kubectl user access
```
mkdir -p ~/.kube/
sudo cp /etc/kubernetes/admin.conf ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
```

## Configure pod networking
```
kubectl apply -f kube-flannel.yml
```

# Allow scheduling of workloads on master
```
kubectl taint nodes point node-role.kubernetes.io/master:NoSchedule-
```

## Create a frontend pod
```
kubectl create -f frontend.yml
```
