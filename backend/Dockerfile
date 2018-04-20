
FROM debian:stretch as builder

LABEL maintainer="BlueBrain NSE(Neuroscientific Software Engineering)"

ARG circuit_path
ARG redis_host

ENV DEBIAN_FRONTEND=noninteractive
ENV CIRCUIT_PATH=$circuit_path
ENV REDIS_HOST=$redis_host

# Install system dependencies
# TODO: possibly to reduce amount of packages installed
# to decrease the size of resulting docker image
RUN apt-get update && apt-get install -yq --no-install-recommends \
    locales \
    python-dev \
    build-essential \
    libreadline-dev \
    rsync \
    libz-dev

ENV LANG en_US.UTF-8

RUN sed -i -e "s/# $LANG.*/$LANG UTF-8/" /etc/locale.gen \
  && echo "LANG=$LANG" > /etc/default/locale \
  && locale-gen


# Install Neuron
ADD tmp/neuron /tmp/neuron
WORKDIR /tmp/neuron
RUN ./configure \
  --without-x \
  --without-paranrn \
  --with-nrnpython=/usr/bin/python \
  && make -j8 \
  && make install \
  && cd /tmp/neuron/src/nrnpython \
  && python setup.py install \
  && rm -rf /tmp/*

ENV PATH="/usr/local/nrn/x86_64/bin:${PATH}"
ENV PYTHONPATH="/usr/local/nrn/lib/python"


# Install Neurodamus
ADD tmp/bbp /opt/blue-pair/bbp
WORKDIR /opt/blue-pair
ENV HOC_LIBRARY_PATH=/opt/blue-pair/bbp/lib/hoclib
RUN rm -rf bbp/lib/modlib/Bin*.mod \
  && rm -rf bbp/lib/modlib/HDF*.mod \
  && rm -rf bbp/lib/modlib/hdf*.mod \
  && rm -rf bbp/lib/modlib/MemUsage*.mod


# Compile channel mechanisms
RUN nrnivmodl bbp/lib/modlib


# Install blue-pair
WORKDIR /opt/blue-pair




FROM python:2.7.14-slim-stretch
WORKDIR /opt/blue-pair
COPY dist/* ./dist/
RUN apt-get update && \
  apt-get install -yq --no-install-recommends \
    rsync \
    gcc \
    build-essential && \
  pip install \
    --no-cache-dir \
    -i https://bbpteam.epfl.ch/repository/devpi/simple \
    $(ls -t $PWD/dist/*.* | head -n 1) && \
  apt-get remove --purge -y gcc build-essential && \
  apt-get autoremove -y && \
  apt-get clean

ARG circuit_path
ARG redis_host
ENV DEBIAN_FRONTEND=noninteractive
ENV CIRCUIT_PATH=$circuit_path
ENV REDIS_HOST=$redis_host
ENV PATH="/usr/local/nrn/x86_64/bin:${PATH}"
ENV PYTHONPATH="/usr/local/nrn/lib/python"
ENV HOC_LIBRARY_PATH=/opt/blue-pair/hoclib

COPY --from=builder /usr/local/nrn /usr/local/nrn
COPY --from=builder /opt/blue-pair/x86_64 ./x86_64
COPY tmp/bbp/lib/hoclib ./hoclib
COPY entrypoint.sh .

EXPOSE 8000

ENTRYPOINT [ "./entrypoint.sh" ]
