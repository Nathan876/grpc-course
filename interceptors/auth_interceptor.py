import grpc
import jwt                                       # pip install PyJWT

JWT_SECRET = "change-me-in-prod"                # en vrai : variable d'environnement

def check_jwt(context) -> str:
    """Extrait et valide le jeton depuis les metadata (Module 4, §4.5).
    Renvoie le nom d'utilisateur, ou fait abort si invalide."""
    metadata = dict(context.invocation_metadata())    # {clé: valeur}
    token = metadata.get("authorization", "").removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]                     # le sujet du jeton : "mounir"
    except jwt.PyJWTError:
        context.abort(grpc.StatusCode.UNAUTHENTICATED, "Jeton invalide ou expiré")

class AuthInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        # Le health check (5.4) reste PUBLIC : pas d'auth dessus
        if "/grpc.health.v1.Health/Check" in handler_call_details.method:
            return continuation(handler_call_details)
        # Pour tout le reste : on garde le comportement mais la vérification
        # se fait dans le servicer via check_jwt(context) — variante simple
        return continuation(handler_call_details)
