.PHONY: docker_build_version docker_build_latest docker_push_version docker_push_latest help

VERSION?=$(shell cat ../VERSION)

NEURON_VERSION:=7.5
VENV_DIR:=venv
NEURON_SRC_DIR:=tmp/neuron
NEURODAMUS_SRC_DIR:=tmp/bbp

NEURODAMUS_BRANCH ?= sandbox/vangeit/mousify
CIRCUIT_PATH ?= /gpfs/bbp.cscs.ch/project/proj66/circuits/O1/20180305/CircuitConfig
CIRCUIT_NAME ?= mouse-o1
REDIS_HOST ?=

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
	virtualenv --no-site-packages -p python2 $@

$(NEURON_SRC_DIR):
	http_proxy=http://bbpproxy.epfl.ch:80 \
			wget -O tmp/nrn.tar.gz \
			http://www.neuron.yale.edu/ftp/neuron/versions/v$(NEURON_VERSION)/nrn-$(NEURON_VERSION).tar.gz
	tar -xf tmp/nrn.tar.gz -C tmp
	mv "tmp/nrn-$(NEURON_VERSION)" $@
	rm tmp/nrn.tar.gz

$(NEURODAMUS_SRC_DIR):
	git clone https://$$(whoami)@bbpcode.epfl.ch/code/a/sim/neurodamus/bbp $@

install_bluepy: | $(VENV_DIR)
	source $(VENV_DIR)/bin/activate && \
	pip install -i 'https://bbpteam.epfl.ch/repository/devpi/bbprelman/dev/+simple/' bluepy

neurodamus_branch: | $(NEURODAMUS_SRC_DIR)
	cd $(NEURODAMUS_SRC_DIR) && \
	git reset HEAD --hard && \
	git pull --all && \
	git checkout -f $(NEURODAMUS_BRANCH)

python_build: | $(VENV_DIR)
	$(VENV_DIR)/bin/python setup.py sdist

run_dev:
	docker run \
		--rm \
		-it \
		-v /gpfs:/gpfs:ro \
		-e DEBUG=True \
		-v $$(pwd)/blue_pair:/usr/local/lib/python2.7/dist-packages/blue_pair \
		-p 8888:8000 \
		bp-svc-$(CIRCUIT_NAME)

copy_circuit_data: morphology_generate_list
	./copy-circuit-data.sh \
		$(CIRCUIT_PATH) \
		$(shell oc get pods -o custom-columns=:.metadata.name | grep bp-svc-$(CIRCUIT_NAME))

morphology_generate_list: install_bluepy
	source $(VENV_DIR)/bin/activate && \
	cd tmp && \
	CIRCUIT_PATH=$(CIRCUIT_PATH) python ../tools/generate-morphology-list.py

docker_build_version: neurodamus_branch python_build | $(NEURON_SRC_DIR)
	docker build -t bp-svc-$(CIRCUIT_NAME):$(VERSION) \
		--build-arg=redis_host=$(REDIS_HOST) \
		--build-arg=circuit_path=$(CIRCUIT_PATH) \
		--build-arg=http_proxy=http://bbpproxy.epfl.ch:80/ \
		--build-arg=https_proxy=http://bbpproxy.epfl.ch:80/ \
		.

docker_build_latest: neurodamus_branch python_build | $(NEURON_SRC_DIR)
	docker build -t bp-svc-$(CIRCUIT_NAME):latest \
		--build-arg=redis_host=$(REDIS_HOST) \
		--build-arg=circuit_path=$(CIRCUIT_PATH) \
		--build-arg=http_proxy=http://bbpproxy.epfl.ch:80/ \
		--build-arg=https_proxy=http://bbpproxy.epfl.ch:80/ \
		.

docker_push_version: docker_build_version
	docker tag bp-svc:$(VERSION) docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc-$(CIRCUIT_NAME):$(VERSION)
	docker push docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc-$(CIRCUIT_NAME):$(VERSION)
	@echo 'backend version($(VERSION)) pushed to OpenShift registy'

docker_push_latest:
	docker tag bp-svc-$(CIRCUIT_NAME):latest docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc-$(CIRCUIT_NAME):latest
	docker push docker-registry-default.ocp.bbp.epfl.ch/bbp-ou-nse/bp-svc-$(CIRCUIT_NAME):latest
	@echo 'backend latest version pushed to OpenShift registry.'
	@echo 'backend release done'
