using UnityEngine.Networking;

// --- CLASE COMPARTIDA PARA EVITAR ERRORES DE SSL/HTTPS EN ALGUNOS CELULARES ---
public class BypassCertificate : CertificateHandler
{
    protected override bool ValidateCertificate(byte[] certificateData)
    {
        return true; // Aceptamos el certificado del servidor aunque sea de prueba o gratuito
    }
}