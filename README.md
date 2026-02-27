# Dataset: Padrón Municipal de Madrid para Chatbots

Este repositorio contiene un corpus consolidado de información sobre el trámite de empadronamiento en la ciudad de Madrid, procesado y optimizado para ser consumido por modelos de lenguaje (LLMs) y sistemas de chatbot.

## 📂 Estructura del Proyecto

### 1. Corpus Maestro (Recomendado)

- **[madrid_padron_master_corpus.json](madrid_padron_master_corpus.json)**: El archivo más completo. Agrupa preguntas y respuestas sobre procedimientos, documentación, base legal y localización de oficinas en un solo lugar.

### 2. Conjuntos de Datos Específicos (JSON)

- **Procedimientos**: `padrón_procedimiento_faq_bot.json` - Lógica de trámites online vs presencial.
- **Documentación**: `padrón_documentación_faq_bot.json` - Requisitos de identidad y vivienda.
- **Oficinas**:
  - `oficinas_con_fotos.json`: 9 oficinas con imágenes locales y detalles de trámites.
  - `oficinas_sin_fotos.json`: 17 oficinas con datos técnicos y trámites, sin imagen.
- **FAQ Rápida**: `padrón_faq_bot.json` - Respuestas cortas sobre certificados y altas.

### 3. Recursos Visuales y Documentos

- **[foto_oficinas/](foto_oficinas/)**: Imágenes optimizadas de las Oficinas de Atención a la Ciudadanía (OAC).
- **[documentos/](documentos/)**: Formularios oficiales en PDF.

## 🚀 Uso para Chatbots

Los archivos JSON están estructurados en pares `p` (pregunta) y `r` (respuesta) o en categorías de fácil indexación.

**Ejemplo de integración de Oficinas:**
Cada oficina incluye un campo `TRAMITES` extraído de la API oficial de Madrid y un `MAPA-URL` dinámico para facilitar la navegación del usuario final.

---

_Datos procesados a partir de Open Data Madrid y Sede Electrónica del Ayuntamiento._
