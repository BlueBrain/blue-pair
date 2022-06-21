#!/usr/bin/env python
from setuptools import setup, find_packages

from blue_pair.version import VERSION


setup(
    name='blue-pair',
    description='bluePair(Pair recording app)',
    version=VERSION,
    url='https://blue-pair/',
    author='NSE(Neuroscientific Software Engineering)',
    author_email='bbp-ou-nse@groupes.epfl.ch',

    install_requires=[
        'tornado==6.1',
        'redis==4.1.2',
        'hiredis==2.0.0',
        'numpy==1.22.1',
        'bglibpy==4.5.30.1',
        'bluepy==2.4.3',
        'debugpy==1.5.1',
        'neuron==8.0.1'
    ],
    tests_require=['pytest', 'pytest-cov'],
    packages=find_packages(exclude=[]),
    scripts=[],
)
