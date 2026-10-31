import os

import core.cortex.cognition
import core.cortex.memory



class Cortex:

    def __init__(self):

        self.cognition = core.cortex.cognition.Cognition()
        self.memory = core.cortex.memory.Memory()
