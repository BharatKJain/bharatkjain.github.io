+++
title = "Debugging and Enabling graceful shutdown in Kubernetes"
date = 2023-10-24T04:00:00+05:30
type = "post"
description = "Implementing graceful shutdown in applications hosted with Istio"
in_search_index = true
[taxonomies]
tags = ["istio", "kubernetes"]
+++

This article is referenced from ["Rising Stack - Graceful shutdown with Node.js and Kubernetes"](https://blog.risingstack.com/graceful-shutdown-node-js-kubernetes/).


## TL;DR



## Pre-requisites:

- Basic Kubernetes knowledge, relation between nodes and pods.
- Understanding of linux signals and handling them in code.
- Kubernetes readiness and liveness probes.


## Why handle graceful-shutdown?

When running AWS EC2 spot instances in AWS EKS to save cost for infrastructure, the EC2 instance is taken down randomly based on availability, in such cases we have to handle the termination of pods that were running inside the node.

Even if we’re running workloads on EC2 on-demand instances, there are still chances that some pods can go-down in such cases also we need to handle their termination.

Whenever a pod gets terminated in Kubernetes, the main process of the container receives the SIGTERM.

## What is graceful-shutdown and how to handle it in Kubernetes workloads?

In Kubernetes, for a proper graceful shutdown we need to add a readinessProbe to our application’s Deployment yaml and let the Service’s load balancer know during the shutdown that we will not serve more requests so it should stop sending them. We can close the server, tear down the DB connections and exit only after that.


## Process(as shown in diagram):

![](/images/graceful-shutdown-k8s.png)

1. Application pod receives SIGTERM signal on process ID 0 because Kubernetes wants to stop it – because of deploy, scale, etc.

2. App (pod) starts to return 500 for GET /health to let readinessProbe (Service) know that it’s not ready to receive more requests.

3. Kubernetes readinessProbe checks GET /health and after (failureThreshold * periodSecond) it stops redirecting traffic to the app (because it continuously returns 500)

4. App waits (failureThreshold * periodSecond) before it starts to shut down – to make sure that the Service is getting notified via readinessProbe fail

5. App starts graceful shutdown

6. App first closes server with live working DB connections

7. App closes databases after the server is closed

8. App exits process

9. Kubernetes force kills the application after 30s (SIGKILL) if it’s still running (in an optimal case it doesn’t happen), we can increase the SIGKILL time using terminationGracePeriodSeconds



## How does Istio sidecar handle the graceful-shutdown?

Istio sidecar intercepts all the incoming traffic to the pod, thus it also halts the traffic, by handling readinessProbe configuration in sidecar, we have seen that even if the readiness probe is not configured correctly in application, the sidecar halts the traffic, and starts draining, we should explicitly keep the readiness probe correctly configured in application container, even though sidecar will halt the traffic.

Istio configmap change required for istio sidecar graceful termination:

```
    defaultConfig:
      holdApplicationUntilProxyStarts: true
      terminationDrainDuration: 60s
      proxyMetadata:
        EXIT_ON_ZERO_ACTIVE_CONNECTIONS: 'true'
```

Sidecar waits for 60s so application can terminate the connections and then it kills the sidecar. For more information please refer to istio documentation. 

This was a long-pending issue with sidecar, previously this was handled using preStop hook - issue link.


## GOTCHA! - SIGTERM is sent to process ID 0, which can be bash
When we added the code for term signal handling, we saw a weird issue where the container exited on receiving the SIGTERM, which meant that something killed it, at this point we realised that Kubernetes is sending the SIGTERM to main process - process ID 0 i.e. the bash parent process which starts the server, then we had to add more support in bash, where we added a trap for SIGTERM and forwarded SIGTERM to application process ID.

On the other hand, we can avoid the bash in process ID 0 in some cases where there's no script or script can be removed, and we can make the application executable/binary run on process ID 0, so there’s no need to add an extra handler.


### Reference articles

- [Making istio sidecar ready before application start - holdApplicationUntilProxyStarts](https://github.com/istio/istio/issues/11130)
- [Draining sidecar connections - terminationDrainDuration](https://github.com/istio/istio/issues/34855)
- [Istio healthcheck](https://istio.io/latest/docs/ops/configuration/mesh/app-health-check/)