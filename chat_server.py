import sys
sys.path.append('generated')
import grpc
from concurrent import futures
from generated import chat_pb2, chat_pb2_grpc

# ---- L'état partagé du serveur (en mémoire pour le cours) ----
MESSAGES = []          # Historique de tous les messages reçus
SUBSCRIBERS = []       # Files d'attente des clients connectés en bidirectionnel


class ChatService(chat_pb2_grpc.ChatServiceServicer):

    # ================= 1. UNARY =================
    def SendMessage(self, request, context):
        """Le cas simple : 1 requête → 1 réponse.
        `request` est déjà un objet ChatMessage décodé.
        On stocke, on renvoie un accusé (ici : le message horodaté)."""
        MESSAGES.append(request)
        return chat_pb2.ChatMessage(
            user=request.user,
            text=f"✅ Reçu par le serveur : {request.text}",
            timestamp=request.timestamp,
        )

    # ================= 2. SERVER STREAMING =================
    def History(self, request, context):
        """Le client demande l'historique des messages d'un user.
        On `yield` un message à la fois : le serveur POUSSERA chaque
        élément au client dès qu'on le produit. Le client les reçoit
        au fur et à mesure (pas besoin d'attendre toute la liste)."""
        for msg in MESSAGES:
            if msg.user == request.user:
                yield msg                # ← "stream" côté returns = yield

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
        import queue, threading
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


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    chat_pb2_grpc.add_ChatServiceServicer_to_server(ChatService(), server)
    server.add_insecure_port("[::]:50052")
    server.start()
    print("✅ Serveur Chat gRPC sur le port 50052")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
