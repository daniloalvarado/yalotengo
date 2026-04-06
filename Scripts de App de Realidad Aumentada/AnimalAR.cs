using UnityEngine;

public class AnimalAR : MonoBehaviour
{
    [Header("Palabra Clave (Nombre Científico o Común)")]
    public string idFirebase;  

    public void FuiEscaneado()
    {
        LectorApiAR lector = FindObjectOfType<LectorApiAR>();
        if (lector != null)
        {
            // Le pasamos el ID y ESTE transform para que el modelo se pegue aquí
            lector.BuscarDatosEnLaNube(idFirebase, this.transform);
        }
    }
}