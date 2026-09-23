import sys
sys.path.append('generated')
import grpc
from generated import user_pb2, user_pb2_grpc

# 1. Un "channel" = la connexion vers le serveur (comme une prise électrique)
with grpc.insecure_channel("localhost:50051") as channel:
    # 2. Le stub = le client généré qui connaît les méthodes du service
    stub = user_pb2_grpc.UserServiceStub(channel)
    # 3. L'appel RPC : comme une fonction locale... qui traverse le réseau
    try:
        response = stub.GetUser(user_pb2.GetUserRequest(user_id=1))
    except grpc.RpcError as e:
        print(e.details())

    print(f"Nom : {response.user.name}")
    print(f"Email : {response.user.email}")
