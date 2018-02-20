
FROM debian:stretch

LABEL maintainer="BlueBrain NSE(Neuroscientific Software Engineering)"

ARG circuit_path

ENV DEBIAN_FRONTEND=noninteractive
ENV CIRCUIT_PATH=$circuit_path

# Install system dependencies
# TODO: possibly to reduce amount of packages installed
# to decrease the size of resulting docker image
RUN apt-get update \
  && apt-get install -y -q \
  locales \
  iptables \
  build-essential \
  python-dev \
  python2.7 \
  python-pip \
  libreadline-dev \
  libz-dev \
  libncurses-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && pip install --upgrade setuptools pip virtualenv

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

# install latest sdist, this has to be run before: venv/bin/python setup.py sdist
COPY dist/* dist/
RUN pip install \
  --no-cache-dir \
  -i https://bbpteam.epfl.ch/repository/devpi/simple \
  $(ls -t $PWD/dist/*.* | head -n 1)

ADD entrypoint.sh entrypoint.sh

WORKDIR /opt/blue-pair

EXPOSE 8000

ENTRYPOINT [ "./entrypoint.sh" ]
