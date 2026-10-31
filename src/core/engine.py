import collections
import pathlib

import core.nexus
import core.cortex



class Engine:

    def __init__(self):

        self.nexus = core.nexus.Nexus()
        self.cortex = core.cortex.Cortex()

        self.build()

    def build(self):

        if pathlib.Path("/environment/storage/.meta").exists():

            self.nexus.index.load("/environment/storage/.meta/index")
        
        else:

            pathlib.Path("/environment/storage/.meta").mkdir()

            for unit, content in self.nexus.corpus.storage.items():

                for lesson in content.keys():

                    view = self.nexus.corpus.view(lesson[:-5])[lesson[:-5]]

                    for chunk in view["content"].split("\n\n"):

                        if chunk.strip():

                            document = (
                                f"{view["title"]}\n"
                                f"\n"
                                f"{view["description"]}\n"
                                f"\n"
                                f"{chunk}\n"
                            )

                            embedding = self.cortex.cognition.embedding(document)
                            self.nexus.index.insert(document, embedding)

                for tasks in content.values():

                    for task in tasks:

                        view = self.nexus.corpus.view(task[:-5])[task[:-5]]

                        if view["type"] == "choice":

                            document = (
                                f"Question: {view["content"]["question"]}\n"
                                f"\n"
                                f"Answer: {view["content"]["answer"]}\n"
                            )

                            embedding = self.cortex.cognition.embedding(document)
                            self.nexus.index.insert(document, embedding)

            self.nexus.index.save("/environment/storage/.meta/index")

    def view(self, id):

        return self.nexus.view(id)

    def query(self, prompt):

        context = (
            f"You are a friendly assistant for AI-centered Compendium. Answer queries using only relevant knowledge below.\n"
            f"\n"
            f"Query: {prompt}\n"
            f"\n"
            f"Knowledge:\n"
            f"\n"
            f"{'\n\n---\n\n'.join([node.content for node in self.nexus.search(self.cortex.cognition.embedding(prompt), 5)])}"
        )

        answer = self.cortex.cognition.llm(context)

        return answer



        