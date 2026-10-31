FROM python:3.14-slim AS builder

RUN apt-get update
RUN apt-get install -y --no-install-recommends build-essential
RUN pip install --no-cache-dir build==1.6.0 cmake==4.4 nanobind==3.0.1 ninja==1.13 packaging==26.0 pathspec==1.1.1 pyproject_hooks==1.2.0 scikit-build-core==1.0

WORKDIR /environment
COPY ./src/core/nexus/index .
RUN python -m build --wheel --no-isolation --outdir dist

FROM python:3.14-slim AS runner

RUN pip install fastapi==0.161.1 uvicorn==0.54.0
COPY --from=builder /environment/dist/*.whl /opt
RUN pip install --no-cache-dir /opt/*.whl

WORKDIR /environment
COPY . .

CMD ["python", "/environment/src/main.py"]