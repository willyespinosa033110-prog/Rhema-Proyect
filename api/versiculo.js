export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { entrada, versiculosUsados } = req.body;

    if (!entrada || typeof entrada !== "string") {
      return res.status(400).json({ error: "Falta el texto de entrada" });
    }

    const listaEvitar = Array.isArray(versiculosUsados) && versiculosUsados.length
      ? `No repitas ninguno de estos versículos ya usados: ${versiculosUsados.join(", ")}.`
      : "";

    const prompt = `Una persona escribió lo siguiente sobre lo que está sintiendo o viviendo:
"${entrada}"

Primero, piensa con cuidado en la situación real detrás de lo que escribió: qué le está pasando concretamente, qué emoción hay debajo (aunque no la nombre directamente), qué necesita escuchar alguien en ese lugar específico — no te quedes en la superficie de una sola palabra.

Luego elige UN versículo bíblico real, citado tal cual aparece en la Reina-Valera 1960, palabra por palabra, sin parafrasear, sin modernizar el lenguaje, sin lenguaje inclusivo ni adaptaciones de ningún tipo — el texto original exacto de esa versión. ${listaEvitar}

Después escribe una interpretación breve (máximo 35 palabras) que le explique a la persona cómo aplicar o entender ese versículo específicamente para lo que ella describió — no una reflexión emocional genérica, sino una guía concreta de qué significa ese versículo para su situación particular.

Responde ÚNICAMENTE en este formato JSON, sin texto adicional, sin markdown, sin backticks:
{"texto": "el versículo exacto aquí", "ref": "Libro capítulo:versículo", "reflexion": "la interpretación breve y concreta aquí"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error de Anthropic:", errText);
      return res.status(502).json({ error: "Error al conectar con la IA" });
    }

    const data = await response.json();
    const textoRespuesta = data.content.map((b) => b.text || "").join("").trim();
    const limpio = textoRespuesta.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(limpio);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
                                  }
