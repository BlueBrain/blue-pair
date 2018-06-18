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
        'futures',
        'tornado',
        'redis',
        'hiredis',
        'numpy',
        'pandas',
        'bglibpy',
        'bluepy',
        'neurom'
    ],
    tests_require=['pytest', 'pytest-cov'],
    packages=find_packages(exclude=[]),
    scripts=[],
)
