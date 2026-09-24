import time

import grpc


class LoggingInterceptor(grpc.ServerInterceptor):
    """Logue chaque appel : méthode, x-client-agent (Module 3.6), durée."""

    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method       # ex. "/chat.v1.ChatService/SendMessage"
        metadata = dict(handler_call_details.invocation_metadata or [])
        # Pas "x-user-agent" : grpc-web réserve ce header pour lui-même
        # (valeur "grpc-web-javascript/0.1" toujours ajoutée côté client).
        client_agent = metadata.get("x-client-agent", "?")
        start = time.time()

        handler = continuation(handler_call_details)   # passe la main au servicer
        if handler is None:
            return None

        def log():
            print(f"📥 {method} — x-client-agent={client_agent} — {(time.time() - start) * 1000:.0f} ms")

        # gRPC a 4 formes de RPC (unary/stream de chaque côté) : on ne peut
        # pas supposer unary_unary, sinon History (server streaming) casse.
        if handler.unary_unary:
            def unary_unary(request, context):
                try:
                    return handler.unary_unary(request, context)
                finally:
                    log()
            return grpc.unary_unary_rpc_method_handler(
                unary_unary,
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )

        if handler.unary_stream:
            def unary_stream(request, context):
                try:
                    yield from handler.unary_stream(request, context)
                finally:
                    log()
            return grpc.unary_stream_rpc_method_handler(
                unary_stream,
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )

        if handler.stream_unary:
            def stream_unary(request_iterator, context):
                try:
                    return handler.stream_unary(request_iterator, context)
                finally:
                    log()
            return grpc.stream_unary_rpc_method_handler(
                stream_unary,
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )

        def stream_stream(request_iterator, context):
            try:
                yield from handler.stream_stream(request_iterator, context)
            finally:
                log()
        return grpc.stream_stream_rpc_method_handler(
            stream_stream,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )