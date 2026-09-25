import sys
import queue
import threading
from concurrent import futures
import grpc

# Imports du Health Check gRPC
from grpc_health.v1 import health, health_pb2, health_pb2_grpc

sys.path.append('generated')
from generated import chat_pb2, chat_pb2_grpc
from interceptors.auth_interceptor import AuthInterceptor, check_jwt, JWT_SECRET

# ---- L'état partagé du serveur (en mémoire pour le cours) ----
MESSAGES = []          # Historique de tous les messages reçus
SUBSCRIBERS = []       # Files d'attente des clients connectés en bidirectionnel
JWT_SECRET = "JE_SUIS_UNE_CLE_SECRETE_PAS_TRES_SECRETE"

class ChatService(chat_pb2_grpc.ChatServiceServicer):

    # ================= 1. UNARY =================
    def SendMessage(self, request, context):
        """Le cas simple : 1 requête → 1 réponse.
        `request` est déjà un objet ChatMessage décodé.
        On stocke, on renvoie un accusé (ici : le message horodaté)."""
        check_jwt(context)   # abort UNAUTHENTICATED si le JWT est absent/invalide

        MESSAGES.append(request)

        return chat_pb2.ChatMessage(
            user=request.user,
            text=f"✅ Reçu par le serveur : {request.text}",
            timestamp=request.timestamp,
        )

    def DeleteMessage(self, request, context):
        trouve = False
        for msg in MESSAGES:
            if msg.user == request.user:
                trouve = True
                MESSAGES.remove(msg)
        if not trouve:
            context.abort(grpc.StatusCode.NOT_FOUND, "Le message n'existe pas")
        return chat_pb2.UploadSummary(
            count=1
        )
    # ================= 2. SERVER STREAMING =================
    def History(self, request, context):
        """Le client demande l'historique des messages d'un user.
        On `yield` un message à la fois : le serveur POUSSERA chaque
        élément au client dès qu'on le produit. Le client les reçoit
        au fur et à mesure (pas besoin d'attendre toute la liste)."""
        message = []
        for msg in MESSAGES:
            if msg.user == request.user:
                message.append(msg)
        message = message[-request.limit:]

        for msg in message:
            yield msg            # ← "stream" côté returns = yield

    # ================= 3. CLIENT STREAMING =================
    def UploadBatch(self, request_iterator, context):
        """Le client envoie PLUSIEURS SubscribeRequest, puis ferme son flux.
        `request_iterator` est un itérateur : on le consomme avec un for.
        On ne répond UNE SEULE fois, à la fin (le résumé)."""
        count = 0
        for req in request_iterator:     # chaque élément envoyé par le client
            for msg in req.messages:     # chaque message de la liste "repeated"
                MESSAGES.append(msg)
                count += 1
        return chat_pb2.UploadSummary(count=count)   # réponse unique finale

    # ================= 4. BIDIRECTIONNEL =================
    def Chat(self, request_iterator, context):
        """Le plus puissant : les deux côtés streament en parallèle.
        Technique utilisée ici : une queue (file d'attente) par client.
        - un thread interne lit ce que le client ENVOIE (request_iterator)
          et le broadcaste dans la queue de tous les connectés ;
        - le générateur (cette méthode) lit SA propre queue et yield
          chaque message au client."""
        my_queue = queue.Queue()
        SUBSCRIBERS.append(my_queue)

        def reader():
            """Thread : consomme ce que CE client envoie."""
            for msg in request_iterator:
                for q in SUBSCRIBERS:      # broadcast à tout le monde
                    q.put(msg)

        threading.Thread(target=reader, daemon=True).start()

        # Boucle : dès qu'un message arrive dans ma queue, je le yield
        while context.is_active():        # is_active = la connexion est ouverte
            try:
                msg = my_queue.get(timeout=1)   # timeout pour revérifier is_active
                yield msg                          # envoi au client
            except queue.Empty:
                continue                          # rien reçu : on reboucle

    # ================= 5. LOGIN =================
    def Login(self, request, context):
        if not request.username.strip():
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Le nom d'utilisateur est vide")

        payload = {
            "sub": request.username,
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        return chat_pb2.LoginResponse(token=token)

def serve():
    # 1. Chargement des certificats mTLS
    with open("certs/server.key", "rb") as f:
        private_key = f.read()
    with open("certs/server.crt", "rb") as f:
        cert_chain = f.read()
    with open("certs/ca.crt", "rb") as f:
        root_ca = f.read()

    server_credentials = grpc.ssl_server_credentials(
        private_key_certificate_chain_pairs=[(private_key, cert_chain)],
        root_certificates=root_ca,
        require_client_auth=True,
    )

    # 2. Initialisation du serveur gRPC
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # 3. 🩺 AJOUT DU HEALTH CHECK
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)

    # 4. Ajout de votre service de Chat
    chat_pb2_grpc.add_ChatServiceServicer_to_server(ChatService(), server)

    # 5. Configuration du port sécurisé et démarrage
    server.add_secure_port("0.0.0.0:50052", server_credentials)

    server.start()
    print("✅ Serveur gRPC sécurisé (mTLS + Health Check) démarré sur le port 50052")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()