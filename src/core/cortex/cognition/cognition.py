import json
import os
import urllib.request



class Cognition:

    def __init__(self):

        pass

    def embedding(self, content):

        request = urllib.request.Request(
            f"{os.environ["CONFIGURATION___INFERENCE_ENDPOINT"]}/embeddings",
            data = json.dumps({
                "model": os.environ["CONFIGURATION___EMBEDDING_TAG"],
                "input": content
            }).encode("utf-8"),
            headers = {
                "Content-Type": "application/json"
            }
        )

        try:

            with urllib.request.urlopen(request) as response:

                result = json.loads(response.read().decode("utf-8"))

        except urllib.error.HTTPError as exception:

            raise exception

        return result["data"][0]["embedding"]

    def completion(self, prompt):

        request = urllib.request.Request(
            f"{os.environ["CONFIGURATION___INFERENCE_ENDPOINT"]}/chat/completions",
            data = json.dumps({
                "model": os.environ["CONFIGURATION___LLM_TAG"],
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }).encode("utf-8"),
            headers = {
                "Content-Type": "application/json"
            }
        )

        try:

            with urllib.request.urlopen(request) as response:

                result = json.loads(response.read().decode("utf-8"))

        except urllib.error.HTTPError as exception:

            raise exception

        return result["choices"][0]["message"]["content"]

    def parse(self, prompt, schema):

        request = urllib.request.Request(
            f"{os.environ["CONFIGURATION___INFERENCE_ENDPOINT"]}/chat/completions",
            data = json.dumps({
                "model": os.environ["CONFIGURATION___LLM_TAG"],
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": json.loads(schema)
                },
            }).encode("utf-8"),
            headers = {
                "Content-Type": "application/json"
            }
        )

        try:

            with urllib.request.urlopen(request) as response:

                result = json.loads(response.read().decode("utf-8"))

        except urllib.error.HTTPError as exception:

            raise exception

        return result["choices"][0]["message"]["content"]