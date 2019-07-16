.PHONY: docker_build_version docker_build_latest docker_push_version docker_push_latest help

VERSION?=$(shell cat ../VERSION)

NEURON_SRC_URL:=https://neuron.yale.edu/ftp/neuron/versions/v7.6/7.6.5/nrn-7.6.5.tar.gz
VENV_DIR:=venv
NEURON_SRC_DIR:=tmp/neuron
NEURODAMUS_SRC_DIR:=tmp/bbp

REDIS_HOST?=

define HELPTEXT
Makefile usage
  Targets:
    python_build                  Build and package python.
    run_dev                       Run development instance of the backend, requires:
                                   docker engine and /gpfs mounted volume.
    docker_build_version          Build backend local docker image with the version tag.
    docker_build_latest           Build backend local docker image with the latest tag.
    docker_push_version           Tag docker image with version and push to OpenShift registry.
    docker_push_latest            Tag docker image with the latest and push to OpenShift registry.
                                    This will result in the updated backend running in OpenShift.
endef
export HELPTEXT

help:
	@echo "$$HELPTEXT"

$(VENV_DIR):
	python3 -m venv venv

$(NEURON_SRC_DIR):
	http_proxy=http://bbpproxy.epfl.ch:80 \
			wget -O tmp/nrn.tar.gz $(NEURON_SRC_URL)
	mkdir -p $@
	tar -xf tmp/nrn.tar.gz --strip-components=1 -C $@
	rm tmp/nrn.tar.gz

$(NEURODAMUS_SRC_DIR):
	git clone https://$$(whoami)@bbpcode.epfl.ch/code/a/sim/neurodamus/bbp $@
	chmod -R 777 $@
	cd $@ && git reset HEAD --hard

python_build: | $(VENV_DIR)
	$(VENV_DIR)/bin/python setup.py sdist

run_dev:
	docker run \
		--rm \
		--user 1000 \
		-it \
		-v /gpfs:/gpfs:ro \
		-e DEBUG=True \
		-v $$(pwd)/blue_pair:/usr/local/lib/python3.7/site-packages/blue_pair \
		-p 8888:8000 \
		bp-svc

docker_build_version: python_build | $(NEURON_SRC_DIR) $(NEURODAMUS_SRC_DIR)
	docker build -t bp-svc:$(VERSION) \
		--build-arg=redis_host=$(REDIS_HOST) \
		--build-arg=http_proxy=http://bbpproxy.epfl.ch:80/ \
		--build-arg=https_proxy=http://bbpproxy.epfl.ch:80/ \
		.

docker_build_latest: python_build | $(NEURON_SRC_DIR) $(NEURODAMUS_SRC_DIR)
	docker build -t bp-svc:latest \
		--build-arg=redis_host=$(REDIS_HOST) \
		--build-arg=http_proxy=http://bbpproxy.epfl.ch:80/ \
		--build-arg=https_proxy=http://bbpproxy.epfl.ch:80/ \
		.

docker_push_version: docker_build_version
	docker tag bp-svc:$(VERSION) docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc:$(VERSION)
	docker push docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc:$(VERSION)
	@echo 'backend version($(VERSION)) pushed to OpenShift registy'

docker_push_latest: docker_build_latest
	docker tag bp-svc:latest docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc:latest
	docker push docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc:latest
	@echo 'backend latest version pushed to OpenShift registry.'
	@echo 'backend release done'
