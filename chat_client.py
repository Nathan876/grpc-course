import sys
sys.path.append('generated')
import grpc
from generated import chat_pb2, chat_pb2_grpc

channel = grpc.insecure_channel("localhost:50052")
stub = chat_pb2_grpc.ChatServiceStub(channel)

# ---- 1. UNARY : un appel, une réponse ----
ack = stub.SendMessage(chat_pb2.ChatMessage(
    user="Mounir", text="Bonjour le chat !", timestamp="2026-09-22T10:00:00"))
print("Unary :", ack.text)

# ---- 2. SERVER STREAMING : on boucle sur les réponses poussées ----
print("\nHistorique de Mounir :")
for msg in stub.History(chat_pb2.ChatMessage(user="Mounir")):
    print(f"  [{msg.timestamp}] {msg.user}: {msg.text}")

# ---- 3. CLIENT STREAMING : on passe un GÉNÉRATEUR au stub ----
def batch():
    yield chat_pb2.SubscribeRequest(user="Mounir", messages=[
        chat_pb2.ChatMessage(user="Mounir", text="msg 1", timestamp="t1"),
        chat_pb2.ChatMessage(user="Mounir", text="msg 2", timestamp="t2"),
    ])
    yield chat_pb2.SubscribeRequest(user="Alice", messages=[
        chat_pb2.ChatMessage(user="Alice", text="msg 3", timestamp="t3"),
    ])

summary = stub.UploadBatch(batch())       # le client stream, le serveur résume
print("\nClient streaming :", summary.count, "messages reçus")

# ---- 4. BIDIRECTIONNEL : le stub renvoie un itérateur de réponses ----
# (détaillé et rejoué côté React dans le Module 4 — ici, aperçu simple)
