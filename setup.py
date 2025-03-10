#!/usr/bin/env python3
from setuptools import setup, find_packages
import os

# Read requirements from requirements.txt
with open(os.path.join('backend', 'requirements.txt')) as f:
    requirements = f.read().splitlines()

# Read long description from README.md
with open('README.md', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="deepread",
    version="0.1.0",
    description="A PDF reading and analysis application",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Ngoc Khuat",
    author_email="qn.khuat@gmail.com",  # Replace with your email
    url="https://github.com/qnkhuat/deepread",  # Replace with your repo URL
    packages=find_packages(include=["backend", "backend.*"]),
    include_package_data=True,
    package_data={
        "backend": ["../frontend/dist/**/*"],
    },
    install_requires=requirements,
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "deepread=backend.cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
) 
