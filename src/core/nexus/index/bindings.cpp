#include <nanobind/nanobind.h>
#include <nanobind/stl/map.h>
#include <nanobind/stl/string.h>
#include <nanobind/stl/vector.h>

#include "module.hpp"



NB_MODULE(etesian, module) {

    nanobind::class_<Node>(module, "Node")
        .def(
            nanobind::init<std::string, std::vector<float>, std::map<std::string, std::string>>(),
            nanobind::arg("content") = std::string{}, 
            nanobind::arg("embedding") = std::vector<float>{},
            nanobind::arg("metadata") = std::map<std::string, std::string>{}
        )
        .def(
            nanobind::init<int, std::string, std::vector<float>, std::map<std::string, std::string>>(),
            nanobind::arg("id"),
            nanobind::arg("content") = std::string{}, 
            nanobind::arg("embedding") = std::vector<float>{},
            nanobind::arg("metadata") = std::map<std::string, std::string>{}
        )
        .def_ro("id", &Node::id)
        .def_rw("content", &Node::content)
        .def_rw("embedding", &Node::embedding)
        .def_rw("metadata", &Node::metadata);


    nanobind::class_<Index>(module, "Index")
        .def(
            nanobind::init<>()
        )
        .def("save", &Index::save)
        .def("load", &Index::load)
        .def("insert", &Index::insert)
        .def("search", &Index::search);

}
