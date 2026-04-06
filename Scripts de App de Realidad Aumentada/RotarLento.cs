using UnityEngine;

public class RotarLento : MonoBehaviour
{
    public float velocidadGiro = -200f; // Grados por segundo

    void Update()
    {
        transform.Rotate(0, 0, velocidadGiro * Time.deltaTime);
    }
}
