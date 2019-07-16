
FROM python:3.7-slim-stretch as builder

RUN pip install --upgrade pip setuptools virtualenv

COPY tmp/neuron /tmp/neuron

# Install system dependencies
RUN apt-get update && apt-get install -yq --no-install-recommends \
    build-essential \
    libreadline-dev \
    libz-dev

# Install Neuron
WORKDIR /tmp/neuron
RUN ./configure \
  --without-x \
  --without-paranrn \
  --with-nrnpython=/usr/local/bin/python \
  && make -j8 \
  && make install \
  && cd /tmp/neuron/src/nrnpython \
  && python setup.py install \
  && rm -rf /tmp/*


FROM python:3.7-slim-stretch
LABEL maintainer="BlueBrain NSE(Neuroscientific Software Engineering)"
WORKDIR /opt/blue-pair

ARG redis_host

ENV DEBIAN_FRONTEND=noninteractive
ENV REDIS_HOST=$redis_host
ENV PYTHONPATH="/usr/local/nrn/lib/python"
ENV PATH="/usr/local/nrn/x86_64/bin:${PATH}"

COPY dist/* ./dist/
COPY --from=builder /usr/local/nrn /usr/local/nrn
COPY tmp/bbp /opt/blue-pair/bbp
COPY entrypoint.sh .

RUN chmod -R 777 /opt/blue-pair/bbp
RUN mkdir -m 777 /opt/blue-pair/lib

RUN pip install \
    --no-cache-dir \
    -i https://bbpteam.epfl.ch/repository/devpi/simple \
    $(ls -t $PWD/dist/*.* | head -n 1)

RUN apt-get update && \
  apt-get install -yq --no-install-recommends libncurses-dev build-essential libreadline-dev git

EXPOSE 8000

ENTRYPOINT [ "./entrypoint.sh" ]
