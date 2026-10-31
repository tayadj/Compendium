import collections
import json
import pathlib
import re



class Corpus:

    def __init__(self):

        self.root = "/environment/storage"
        self.storage = collections.defaultdict(lambda: collections.defaultdict(list)) # содержит ссылки на контент
        
        for path in pathlib.Path(self.root).iterdir():

            if path.name.endswith(".json"):

                if path.name.endswith("000-000-000.json"):

                    continue

                elif path.name.endswith("-000-000.json"):

                    self.storage[path.name]

                elif path.name.endswith("-000.json"):

                    self.storage[f"{path.name[:3]}-000-000.json"][path.name]

                else:

                    self.storage[f"{path.name[:3]}-000-000.json"][f"{path.name[:7]}-000.json"].append(path.name)

        self.storage = {
            unit : dict(content)
            for unit, content in self.storage.items()
        }

    def view(self, id):

        preview = {}

        match id.split("-"):

            case ["000", "000", "000"]:

                for unit, lessons in self.storage.items():

                    data = pathlib.Path(f"{self.root}/{unit}").read_text()
                    data = json.loads(data)
                    preview[unit.split(".")[0]] = {
                        "title" : data["title"],
                        "icon": data["icon"],
                        "size": len(lessons)
                    }

            case [unit, "000", "000"]:

                data = pathlib.Path(f"{self.root}/{unit}-000-000.json").read_text()
                data = json.loads(data)
                preview[f"{unit}-000-000"] = {
                        "title" : data["title"],
                        "description": data["description"],
                        "icon": data["icon"],
                        "size": len(self.storage[f"{unit}-000-000.json"])
                }

                for lesson, tasks in self.storage[f"{unit}-000-000.json"].items():

                    data = pathlib.Path(f"{self.root}/{lesson}").read_text()
                    data = json.loads(data)
                    preview[lesson.split(".")[0]] = {
                        "title": data["title"],
                        "description": data["description"],
                        "content": data["content"],
                        "duration": int(len(data["content"]) / 1000 + 1 + len(tasks) * 1.5),
                        "size": len(tasks)
                    }

            case [unit, lesson, "000"]:

                data = pathlib.Path(f"{self.root}/{unit}-{lesson}-000.json").read_text()
                data = json.loads(data)
                preview[f"{unit}-{lesson}-000"] = {
                    "title": data["title"],
                    "description": data["description"],
                    "content": data["content"],
                    "size": len(self.storage[f"{unit}-000-000.json"][f"{unit}-{lesson}-000.json"])
                }

            case [unit, lesson, task]:

                data = pathlib.Path(f"{self.root}/{unit}-{lesson}-{task}.json").read_text()
                data = json.loads(data)
                preview[f"{unit}-{lesson}-{task}"] = {
                    "type": data["type"],
                    "content": data["content"],
                    "size": len(self.storage[f"{unit}-000-000.json"][f"{unit}-{lesson}-000.json"])
                }

        preview = dict(sorted(preview.items()))

        return preview