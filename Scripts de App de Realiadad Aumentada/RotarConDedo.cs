using UnityEngine;
using UnityEngine.EventSystems;

public class RotarConDedo : MonoBehaviour
{
    [Header("¡ARRASTRA TU MODELO AQUÍ!")]
    public Transform modeloAGirar;

    public float velocidadRotacionPC = 5f;
    public float velocidadRotacionCelular = 0.4f;
    
    [Header("Velocidad de Zoom")]
    public float velocidadZoomCelular = 0.1f;
    public float velocidadZoomPC = 10f; // NUEVO: Para la ruedita del ratón

    void Update()
    {
        if (modeloAGirar == null) return; 

        // EVITAR QUE SE ROTE EL MODELO SI ESTAMOS TOCANDO LA INTERFAZ WEB/UI (Como el Scroll de texto)
        if (EventSystem.current != null)
        {
            // Bloquea el toque del celular si el dedo 0 está sobre UI
            if (Input.touchCount > 0 && EventSystem.current.IsPointerOverGameObject(Input.GetTouch(0).fingerId)) return;
            // Bloquea el ratón de la PC si el puntero está sobre UI
            if (EventSystem.current.IsPointerOverGameObject()) return;
        }

        // --- 1. MODO CELULAR (Táctil global) ---
        if (Input.touchCount > 0)
        {
            if (Input.touchCount == 1)
            {
                // ROTAR CON 1 DEDO
                Touch toque = Input.GetTouch(0);
                if (toque.phase == TouchPhase.Moved)
                {
                    float rotX = toque.deltaPosition.x * velocidadRotacionCelular;
                    float rotY = toque.deltaPosition.y * velocidadRotacionCelular;
                    
                    modeloAGirar.Rotate(Camera.main.transform.up, -rotX, Space.World);
                    modeloAGirar.Rotate(Camera.main.transform.right, rotY, Space.World);
                }
            }
            else if (Input.touchCount == 2)
            {
                // ZOOM CON 2 DEDOS (Pellizco)
                Touch t1 = Input.GetTouch(0);
                Touch t2 = Input.GetTouch(1);
                
                Vector2 t1Prev = t1.position - t1.deltaPosition;
                Vector2 t2Prev = t2.position - t2.deltaPosition;
                
                float prevDist = (t1Prev - t2Prev).magnitude;
                float actualDist = (t1.position - t2.position).magnitude;
                float diferencia = (actualDist - prevDist) * velocidadZoomCelular;
                
                Vector3 nuevaEscala = modeloAGirar.localScale + (Vector3.one * diferencia);
                
                // Límites: No dejamos que se vuelva microscópico ni gigante
                nuevaEscala.x = Mathf.Clamp(nuevaEscala.x, 0.1f, 60f);
                nuevaEscala.y = Mathf.Clamp(nuevaEscala.y, 0.1f, 60f);
                nuevaEscala.z = Mathf.Clamp(nuevaEscala.z, 0.1f, 60f);
                
                modeloAGirar.localScale = nuevaEscala;
            }
        }
        
        // --- 2. MODO COMPUTADORA (Ratón y Touchpad) ---
        else 
        {
            // ROTAR CON CLIC IZQUIERDO
            if (Input.GetMouseButton(0))
            {
                float rotX = Input.GetAxis("Mouse X") * velocidadRotacionPC;
                float rotY = Input.GetAxis("Mouse Y") * velocidadRotacionPC;
                
                modeloAGirar.Rotate(Camera.main.transform.up, -rotX, Space.World);
                modeloAGirar.Rotate(Camera.main.transform.right, rotY, Space.World);
            }

            // NUEVO: ZOOM CON RUEDITA DEL RATÓN, TOUCHPAD O TECLADO
            float scroll = Input.GetAxis("Mouse ScrollWheel");

            // Si el touchpad no envía 'ScrollWheel', probamos con 'mouseScrollDelta' (más preciso en laptops)
            if (Mathf.Abs(scroll) < 0.0001f) 
            {
                scroll = Input.mouseScrollDelta.y * 0.1f; 
            }

            // --- TRUCO DEFINITIVO: ZOOM CON TECLADO (+ y -) ---
            // Si el touchpad falla, el usuario puede usar las teclas + y -
            if (Input.GetKey(KeyCode.Plus) || Input.GetKey(KeyCode.KeypadPlus) || Input.GetKey(KeyCode.Equals)) 
                scroll = 0.02f;
            if (Input.GetKey(KeyCode.Minus) || Input.GetKey(KeyCode.KeypadMinus) || Input.GetKey(KeyCode.Underscore)) 
                scroll = -0.02f;

            if (Mathf.Abs(scroll) > 0.0001f)
            {
                // Usamos un sistema multiplicativo Proporcional
                float porcentajeCambio = 1f + (scroll * velocidadZoomPC * 0.2f);
                Vector3 nuevaEscala = modeloAGirar.localScale * porcentajeCambio;
                
                // Límites amplios
                nuevaEscala.x = Mathf.Clamp(nuevaEscala.x, 0.001f, 500f);
                nuevaEscala.y = Mathf.Clamp(nuevaEscala.y, 0.001f, 500f);
                nuevaEscala.z = Mathf.Clamp(nuevaEscala.z, 0.001f, 500f);
                
                modeloAGirar.localScale = nuevaEscala;
            }
        }
    }
}