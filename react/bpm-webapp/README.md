# BPM Webapp

BPM Webapp includes the following modules :

- Generic builder for query & expression generation
- Timer builder for cron & ISO expression generation
- Mapper for query generation

# Installation

To compile and run use following commands:

```bash
$ git clone git@git.axelor.com:aop/addons/axelor-public/react/bpm-webapp.git
$ cd bpm-webapp
$ git checkout main
$ git submodule init
$ git submodule update
$ git submodule update --recursive --remote (to set HEAD to latest commits, not mandatory with new clone)

$ yarn install
$ yarn start
$ yarn run build (for build generation)
```
