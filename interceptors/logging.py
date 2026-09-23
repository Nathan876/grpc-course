import time

class LoggingInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method       # ex. "/chat.v1.ChatService/SendMessage"
        start = time.time()
        # continuation() : passe la main à l'intercepteur/servicer suivant
        handler = continuation(handler_call_details)
        def wrap(behavior, request, context):
            try:
                return behavior(request, context)   # exécute VOTRE méthode
            finally:
                print(f"📥 {method} — {(time.time()-start)*1000:.0f} ms")
        return grpc.unary_unary_rpc_method_handler(
            wrap(handler.unary_unary, ...)) if handler else None

# Enregistrement : on le passe au grpc.server(...)
server = grpc.server(
    futures.ThreadPoolExecutor(max_workers=10),
    interceptors=[LoggingInterceptor()],
)
