# Compendium

Multi-domain collection of AI-centered knowledge for self-pace learning, delivered as a full-stack application featuring native C++ semantic index.

## Overview

At the moment, the project is in the active development phase, but if your inquisitive mind wants to try it out now, all you need is to clone a repository and run it using `docker compose up --build`. I want to emphasize that at the moment there is no no-model version here, so for the project to work locally, you need to download the local LLM and Embedding model - you can either trust me and go with default configuration or choose less demanding options by changing `docker-compose.yml` manually. I also warn you that the first local launch will trigger indexing - this is the process of creating a semantic index for you locally so that AI-features can work fully - it might take time, depending on the capabilities of your device. You can consider the appearance of a file along the path `~/compendium/storage/.meta/index` as a signal of the successful completion of indexing.