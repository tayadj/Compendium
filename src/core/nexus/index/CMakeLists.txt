cmake_minimum_required(VERSION 3.15...3.27)

project(etesian LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(
    Python 3.14
    REQUIRED COMPONENTS Interpreter Development
)

find_package(
    nanobind
    CONFIG REQUIRED
)

nanobind_add_module(
    etesian
    bindings.cpp
)

install(TARGETS etesian LIBRARY DESTINATION .)