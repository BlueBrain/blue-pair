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
        'futures>=3.1.1',
        'tornado>=6.0.4',
        'redis>=3.5.3',
        'hiredis>=1.1.0',
        'numpy>=1.19.2',
        'bglibpy>=4.4.26',
        'bluepy>=2.4.3',
        'debugpy>=1.5.1',
        'neuron>=8.0.0'
    ],
    tests_require=['pytest', 'pytest-cov'],
    packages=find_packages(exclude=[]),
    scripts=[],
)
