# ---- Étape 1 : génération du code ----
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir grpcio grpcio-tools grpcio-health-checking PyJWT
COPY protos/ ./protos/
RUN python -m grpc_tools.protoc --proto_path=protos \
    --python_out=generated --grpc_python_out=generated protos/*.proto

# ---- Étape 2 : image finale ----
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/generated ./generated
COPY services/ ./services/
COPY certs/ ./certs/
COPY main.py .
EXPOSE 50052
CMD ["python", "main.py"]
