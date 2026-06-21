export default function ModelSelector({
    selectedModel,
    setSelectedModel,
  }) {
    return (
      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "16px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <h3>
          Select Annotation Engine
        </h3>
  
        <select
          value={selectedModel}
          onChange={(e) =>
            setSelectedModel(
              e.target.value
            )
          }
          style={{
            width: "350px",
            maxWidth: "100%",
            padding: "12px",
            borderRadius: "10px",
            border:
              "1px solid #d1d5db",
          }}
        >
          <option>
            Ensemble Transformer
          </option>
  
          <option>
            scispaCy + Regex
          </option>
  
          <option>
            Qwen 2.5 (LLM)
          </option>
        </select>
      </div>
    );
  }