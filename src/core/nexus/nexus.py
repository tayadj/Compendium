import core.nexus.corpus
import core.nexus.index


class Nexus:

    def __init__(self):

        self.corpus = core.nexus.corpus.Corpus()
        self.index = core.nexus.index.Index()

    def view(self, id):

        return self.corpus.view(id)

    def search(self, query, size):

        return self.index.search(query, size)