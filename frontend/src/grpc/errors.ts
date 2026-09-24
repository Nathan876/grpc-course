// frontend/src/grpc/errors.ts — un traducteur code gRPC → message humain
export function grpcErrorMessage(err: any): { message: string; retryable: boolean } {
  switch (err?.code) {
    // grpc.Code.NOT_FOUND = 5
    case 5:  return { message: "Ressource introuvable.", retryable: false };
    // INVALID_ARGUMENT = 3 : le client a mal rempli quelque chose
    case 3:  return { message: "Données invalides : vérifiez le formulaire.", retryable: false };
    // UNAUTHENTICATED = 16
    case 16: return { message: "Session expirée, reconnectez-vous.", retryable: false };
    // UNAVAILABLE = 14 : le serveur est injoignable → on PEUT réessayer
    case 14: return { message: "Serveur momentanément indisponible.", retryable: true };
    // DEADLINE_EXCEEDED = 4
    case 4:  return { message: "Délai dépassé, réessayez.", retryable: true };
    default: return { message: "Erreur inattendue. Réessayez.", retryable: true };
  }
}
