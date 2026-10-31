#include <nanobind/nanobind.h>
#include <nanobind/stl/string.h>
#include <nanobind/stl/vector.h>

#include "module.hpp"



NB_MODULE(etesian, module) {

    nanobind::class_<Node>(module, "Node")
        .def(
            nanobind::init<std::string, std::vector<float>>(),
            nanobind::arg("content"),
            nanobind::arg("embedding")
        )
        .def_rw("content", &Node::content)
        .def_rw("embedding", &Node::embedding);


    nanobind::class_<Index>(module, "Index")
        .def(
            nanobind::init<>()
        )
        .def("save", &Index::save)
        .def("load", &Index::load)
        .def("insert", &Index::insert)
        .def("search", &Index::search);

}
