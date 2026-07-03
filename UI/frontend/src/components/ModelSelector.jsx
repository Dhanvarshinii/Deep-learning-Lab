export default function ModelSelector({
  selectedModel,
  setSelectedModel,
}) {
  const approaches = [
    {
      value: "Ensemble Transformer",
      title: "Ensemble Transformer NER",
      description:
        "Combines three fine-tuned biomedical transformer models and selects the highest-confidence entity predictions.",
    },
    {
      value: "scispaCy + Regex",
      title: "scispaCy + Regex NER",
      description:
        "Hybrid biomedical NLP pipeline using multiple scispaCy models together with clinical regex patterns.",
    },
    {
      value: "Qwen 2.5 (LLM)",
      title: "Qwen 2.5 Clinical NER",
      description:
        "Local LLM-powered clinical entity extraction using Qwen 2.5 through Ollama.",
    },
  ];

  return (
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
        marginBottom: "25px",
      }}
    >
      <h3
        style={{
          marginBottom: "5px",
          color: "#1f2937",
        }}
      >
        Annotation Approach
      </h3>

      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          marginBottom: "20px",
        }}
      >
        Choose a clinical NER approach to process the document.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {approaches.map(
          (approach) => {
            const isSelected =
              selectedModel ===
              approach.value;

            return (
              <div
                key={approach.value}
                onClick={() =>
                  setSelectedModel(
                    approach.value
                  )
                }
                style={{
                  border: isSelected
                    ? "2px solid #2563eb"
                    : "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  background:
                    isSelected
                      ? "#eff6ff"
                      : "white",
                  transition:
                    "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="radio"
                    checked={
                      isSelected
                    }
                    readOnly
                  />

                  <strong>
                    {
                      approach.title
                    }
                  </strong>
                </div>

                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    color: "#6b7280",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {
                    approach.description
                  }
                </p>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}