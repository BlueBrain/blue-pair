FROM python:3.8-slim-bullseye as builder

# Install system dependencies
RUN apt-get update && apt-get install -yq \
    build-essential \
    libreadline-dev \
    libz-dev \
    jq

RUN pip install pip neuron==8.0.1 --upgrade

COPY tmp/sim-models /build/sim-models
COPY config.json /build/

RUN repos=$(cat /build/config.json | jq -c -r '.simModel | map(.repo) | unique | .[]') && \
	for repo in $repos; do \
    mod_dirs=$(cat /build/config.json | jq -c -r ".simModel | .[] | select(.repo==\"$repo\") | .modPath"); \
		for mod_dir in $mod_dirs; do \
      cd /build/sim-models/$repo/$mod_dir && nrnivmodl .; \
		done; \
	done


FROM python:3.8-slim-bullseye
LABEL maintainer="BlueBrain NSE(Neuroscientific Software Engineering)"
WORKDIR /opt/blue-pair

ARG redis_host

ENV DEBIAN_FRONTEND=noninteractive
ENV REDIS_HOST=$redis_host
ENV PYTHONPATH="/usr/local/nrn/lib/python"
ENV PATH="/usr/local/nrn/x86_64/bin:${PATH}"

COPY dist/* ./dist/
COPY config.json .
COPY --from=builder /build/sim-models sim-models

COPY entrypoint.sh .

RUN pip install \
    --no-cache-dir \
    -i https://bbpteam.epfl.ch/repository/devpi/simple \
    $(ls -t $PWD/dist/*.* | head -n 1)

EXPOSE 8000

ENTRYPOINT [ "./entrypoint.sh" ]
