import fastapi
import os
import uvicorn

import core



class Application:

    def __init__(self):

        self.engine = core.Engine()
        self.application = fastapi.FastAPI()

        @self.application.get("/api/view")
        def view(id: str):

            response = self.engine.view(id)

            return fastapi.responses.JSONResponse(
                content = fastapi.encoders.jsonable_encoder(response),
                status_code = 200
            )

        @self.application.get("/api/query")
        def query(prompt: str):

            response = self.engine.query(prompt)

            return fastapi.responses.JSONResponse(
                content = fastapi.encoders.jsonable_encoder(response),
                status_code = 200
            )

        self.application.frontend("/", directory = "src/interface")

        uvicorn.run(self.application, host = "0.0.0.0", port = 10000)



if __name__ == "__main__":

    application = Application()


