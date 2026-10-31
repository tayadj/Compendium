#pragma once

#include <algorithm>
#include <fstream>
#include <iostream>
#include <queue>
#include <random>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>



struct Node {

    Node(std::string content, std::vector<float> embedding) : content(content), embedding(embedding) {}

    std::string content;
    std::vector<float> embedding;
    
};



class Index {

    public:

        Index() {}

        void save(const std::string& path) {
            std::ofstream stream(path, std::ios::binary);

            uint32_t magic = 0x49445800;
            stream.write(reinterpret_cast<const char*>(&magic),   sizeof(magic));

            stream.write(reinterpret_cast<const char*>(&sampleSizeInsert), sizeof(sampleSizeInsert));
            stream.write(reinterpret_cast<const char*>(&sampleSizeSearch), sizeof(sampleSizeSearch));
            stream.write(reinterpret_cast<const char*>(&maxConnections),   sizeof(maxConnections));
            stream.write(reinterpret_cast<const char*>(&globalMaxLevel),   sizeof(globalMaxLevel));
            stream.write(reinterpret_cast<const char*>(&currentMaxLevel),  sizeof(currentMaxLevel));
            stream.write(reinterpret_cast<const char*>(&entry),            sizeof(entry));

            uint64_t graphSize = static_cast<uint64_t>(graph.size());
            stream.write(reinterpret_cast<const char*>(&graphSize), sizeof(graphSize));

            for (const Node& node : graph) {
                uint64_t nodeContentSize = static_cast<uint64_t>(node.content.size());
                stream.write(reinterpret_cast<const char*>(&nodeContentSize), sizeof(nodeContentSize));
                if (nodeContentSize) { stream.write(node.content.data(), static_cast<std::streamsize>(nodeContentSize)); }

                uint64_t nodeEmbeddingSize = static_cast<uint64_t>(node.embedding.size());
                stream.write(reinterpret_cast<const char*>(&nodeEmbeddingSize), sizeof(nodeEmbeddingSize));
                if (nodeEmbeddingSize) { stream.write(reinterpret_cast<const char*>(node.embedding.data()), static_cast<std::streamsize>(nodeEmbeddingSize * sizeof(float))); }
            }

            uint64_t neighborsSize = static_cast<uint64_t>(neighbors.size());
            stream.write(reinterpret_cast<const char*>(&neighborsSize), sizeof(neighborsSize));

            for (const auto& level : neighbors) {
                uint64_t levelSize = static_cast<uint64_t>(level.size());
                stream.write(reinterpret_cast<const char*>(&levelSize), sizeof(levelSize));

                for (const auto& id : level) {
                    uint64_t idSize = static_cast<uint64_t>(id.size());
                    stream.write(reinterpret_cast<const char*>(&idSize), sizeof(idSize));
                    if (idSize) { stream.write(reinterpret_cast<const char*>(id.data()), static_cast<std::streamsize>(idSize * sizeof(int))); }
                }
            }

            return;
        }

        void load(const std::string& path) {
            std::ifstream stream(path, std::ios::binary);

            uint32_t magic = 0;
            stream.read(reinterpret_cast<char*>(&magic),   sizeof(magic));

            if (magic != 0x49445800) throw std::runtime_error("Not supported: " + path);

            stream.read(reinterpret_cast<char*>(&sampleSizeInsert), sizeof(sampleSizeInsert));
            stream.read(reinterpret_cast<char*>(&sampleSizeSearch), sizeof(sampleSizeSearch));
            stream.read(reinterpret_cast<char*>(&maxConnections),   sizeof(maxConnections));
            stream.read(reinterpret_cast<char*>(&globalMaxLevel),   sizeof(globalMaxLevel));
            stream.read(reinterpret_cast<char*>(&currentMaxLevel),  sizeof(currentMaxLevel));
            stream.read(reinterpret_cast<char*>(&entry),            sizeof(entry));
            
            uint64_t graphSize = 0;
            stream.read(reinterpret_cast<char*>(&graphSize), sizeof(graphSize));

            graph.clear();
            graph.reserve(static_cast<size_t>(graphSize));

            for (uint64_t idx = 0; idx < graphSize; ++idx) {
                uint64_t nodeContentSize = 0;
                stream.read(reinterpret_cast<char*>(&nodeContentSize), sizeof(nodeContentSize));
                std::string content(static_cast<size_t>(nodeContentSize), '\0');
                if (nodeContentSize) { stream.read(content.data(), static_cast<std::streamsize>(nodeContentSize)); }

                uint64_t nodeEmbeddingSize = 0;
                stream.read(reinterpret_cast<char*>(&nodeEmbeddingSize), sizeof(nodeEmbeddingSize));
                std::vector<float> embedding(static_cast<size_t>(nodeEmbeddingSize));
                if (nodeEmbeddingSize) { stream.read(reinterpret_cast<char*>(embedding.data()), static_cast<std::streamsize>(nodeEmbeddingSize * sizeof(float))); }

                graph.emplace_back(content, embedding);
            }

            uint64_t neighborsSize = 0;
            stream.read(reinterpret_cast<char*>(&neighborsSize), sizeof(neighborsSize));
            
            neighbors.clear();
            neighbors.resize(static_cast<size_t>(neighborsSize));

            for (uint64_t idx = 0; idx < neighborsSize; ++idx) {
                uint64_t levelSize = 0;
                stream.read(reinterpret_cast<char*>(&levelSize), sizeof(levelSize));
                
                neighbors[idx].resize(static_cast<size_t>(levelSize));
                for (uint64_t _idx = 0; _idx < levelSize; ++_idx) {
                    uint64_t idSize = 0;
                    stream.read(reinterpret_cast<char*>(&idSize), sizeof(idSize));

                    neighbors[idx][_idx].resize(static_cast<size_t>(idSize));
                    if (idSize) { stream.read(reinterpret_cast<char*>(neighbors[idx][_idx].data()), static_cast<std::streamsize>(idSize * sizeof(int))); }
                }
            }

            return;
        }

        int insert(const std::string& content, const std::vector<float>& embedding) {
            int nodeId = graph.size();
            int nodeLevel = std::min(globalMaxLevel, distribution(generator));

            graph.emplace_back(content, embedding);
            neighbors.emplace_back(nodeLevel + 1);

            if (entry == -1) {
                entry = nodeId;
                currentMaxLevel = nodeLevel;

                return nodeId;
            }

            const std::vector<float>& nodeEmbedding = graph[nodeId].embedding;

            int entryNode = entry;
            for (int currentLevel = currentMaxLevel; currentLevel > nodeLevel; --currentLevel) {
                entryNode = greedySearch(nodeEmbedding, entryNode, currentLevel);
            }

            for (int currentLevel = std::min(nodeLevel, currentMaxLevel); currentLevel >= 0; --currentLevel) {
                std::vector<int> candidates = beamSearch(nodeEmbedding, entryNode, currentLevel, sampleSizeInsert);
                std::vector<int> selected = selectNeighbors(nodeEmbedding, candidates);

                for (int neighbor : selected) {
                    addEdge(currentLevel, nodeId, neighbor);
                    addEdge(currentLevel, neighbor, nodeId);
                    
                    shrinkNeighbors(currentLevel, neighbor);
                }

                if (!candidates.empty()) {
                    entryNode = candidates[0];
                }
            }

            if (nodeLevel > currentMaxLevel) {
                entry = nodeId;
                currentMaxLevel = nodeLevel;
            }

            return nodeId;
        }

        std::vector<Node> search(const std::vector<float>& query, int cohortSize) {
            int entryNode = entry;
            for (int currentLevel = currentMaxLevel; currentLevel >= 1; --currentLevel) {
                entryNode = greedySearch(query, entryNode, currentLevel);
            }

            std::vector<int> found = beamSearch(query, entryNode, 0, sampleSizeSearch);
            std::sort(
                found.begin(), found.end(), 
                [this, &query](int x, int y) {
                    return distance(graph[x].embedding, query) < distance(graph[y].embedding, query);
                }
            );

            if (found.size() > cohortSize) {
                found.resize(cohortSize);
            }

            std::vector<Node> result;
            for (int idx : found) {
                result.push_back(graph[idx]);
            }
            
            return result;
        }

    protected:

        float distance(const std::vector<float>& x, const std::vector<float>& y) const {
            float dot = 0.0, normX = 0.0, normY = 0.0;
            for (size_t idx = 0; idx < x.size(); ++idx) {
                dot += x[idx] * y[idx];
                normX += x[idx] * x[idx];
                normY += y[idx] * y[idx];
            }
            return 1.0 - dot / (std::sqrt(normX) * std::sqrt(normY));
        }

        int greedySearch(const std::vector<float>& query, int entryNode, int entryLevel) const {
            int currentNode = entryNode;
            float currentDistance = distance(graph[currentNode].embedding, query);

            bool transformed = true;
            while (transformed) {
                transformed = false;

                if (entryLevel >= neighbors[currentNode].size()) { break; }
                for (int neighbor : neighbors[currentNode][entryLevel]) {
                    float neighborDistance = distance(graph[neighbor].embedding, query);
                    if (neighborDistance < currentDistance) {
                        currentDistance = neighborDistance;
                        currentNode = neighbor;
                        transformed = true;
                    }
                }
            }

            return currentNode;
        }

        std::vector<int> beamSearch(const std::vector<float>& query, int entryNode, int entryLevel, int sampleSize) const {
            int currentNode = entryNode;
            float currentDistance = distance(graph[currentNode].embedding, query);

            std::priority_queue<std::pair<float, int>, std::vector<std::pair<float, int>>, std::greater<std::pair<float, int>>> closest;
            std::priority_queue<std::pair<float,int>> farthest;
            std::unordered_set<int> visited;

            closest.push(std::make_pair(currentDistance, currentNode));
            farthest.push(std::make_pair(currentDistance, currentNode));
            visited.insert(currentNode);

            while (!closest.empty()) {
                const auto [candidateDistance, candidateId] = closest.top();
                float worstDistance = farthest.top().first;
                closest.pop();

                if (candidateDistance > worstDistance && farthest.size() >= sampleSize) { break; }
                if (entryLevel >= neighbors[candidateId].size()) { continue; }

                for (int neighbor : neighbors[candidateId][entryLevel]) {
                    if (visited.count(neighbor) > 0) { continue; }

                    visited.insert(neighbor);
                    float neighborDistance = distance(graph[neighbor].embedding, query);
                    worstDistance = farthest.top().first;

                    if (farthest.size() < sampleSize || neighborDistance < worstDistance) {
                        closest.push(std::make_pair(neighborDistance, neighbor));
                        farthest.push(std::make_pair(neighborDistance, neighbor));

                        if (farthest.size() > sampleSize) {
                            farthest.pop();
                        }
                    }
                }
            }

            std::vector<std::pair<float, int>> found;
            while (!farthest.empty()) {
                found.push_back(farthest.top());
                farthest.pop();
            }
            std::sort(found.begin(), found.end());

            std::vector<int> result;
            for (size_t idx = 0; idx < found.size(); ++idx) {
                result.push_back(found[idx].second);
            }

            return result;
        }

        std::vector<int> selectNeighbors(const std::vector<float>& query, const std::vector<int>& candidates) {
            std::vector<std::pair<float, int>> scored;
            for (int candidate : candidates) {
                scored.emplace_back(distance(graph[candidate].embedding, query), candidate);
            }
            std::sort(scored.begin(), scored.end());

            std::vector<int> result;
            for (size_t idx = 0; idx < scored.size() && idx < maxConnections; ++idx) {
                result.push_back(scored[idx].second);
            }

            return result;
        }

        void shrinkNeighbors(int nodeLevel, int nodeIdx) {
            std::vector<int>& nodeNeighbors = neighbors[nodeIdx][nodeLevel];

            if (nodeNeighbors.size() <= maxConnections) {
                return;
            } 
            
            std::vector<std::pair<float, int>> scored;
            for (int neighbor : nodeNeighbors) {
                scored.emplace_back(distance(graph[neighbor].embedding, graph[nodeIdx].embedding), neighbor);
            }
            std::sort(scored.begin(), scored.end());

            nodeNeighbors.clear();
            for (size_t idx = 0; idx < maxConnections; ++idx) {
                nodeNeighbors.push_back(scored[idx].second);
            }

            return;
        }

        void addEdge(int level, int from, int to) {
            if (level >= neighbors[from].size()) {
                neighbors[from].resize(level + 1);
            }

            std::vector<int>& list = neighbors[from][level];
            if (std::find(list.begin(), list.end(), to) == list.end()) {
                list.push_back(to);
            }
        }

    private:

        std::vector<Node> graph;
        std::vector<std::vector<std::vector<int>>> neighbors;

        std::geometric_distribution<int> distribution{1 - 0.5};
        std::mt19937 generator{std::random_device{}()};

        int sampleSizeInsert = 256;
        int sampleSizeSearch = 64;
        int maxConnections = 16;
        int globalMaxLevel = 4;
        int currentMaxLevel = 0;
        int entry = -1;

};