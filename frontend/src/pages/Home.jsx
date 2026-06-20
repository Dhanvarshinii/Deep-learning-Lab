import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [selectedModel, setSelectedModel] = useState("Ensemble Transformer");
  const [text, setText] = useState("");

  const [annotations, setAnnotations] = useState([]);

  const labelColors = {
    PERSON_PROVIDER: "#22c55e",
    MEDICATION: "#ef4444",
    DISEASE: "#f97316",
    DATE: "#3b82f6",
    TIME: "#06b6d4",
    HOSPITAL: "#eab308",
    ANATOMY: "#8b5cf6",
    SYMPTOM: "#ec4899",
  };

  const handleAnnotate = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        {
          model: selectedModel,
          text: text,
        }
      );
  
      console.log(response.data);
  
      setAnnotations(response.data.entities);
    } catch (error) {
      console.error("Backend Error:", error);
    }
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Clinical NER Annotation Tool</h1>

      <p>Human-in-the-loop Clinical Entity Annotation System</p>

      <hr />

      <h2>Select Annotation Engine</h2>

      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        style={{
          padding: "8px",
          minWidth: "250px",
        }}
      >
        <option>Ensemble Transformer</option>
        <option>scispaCy + Regex</option>
        <option>Qwen 2.5 (LLM)</option>
      </select>

      <hr />

      <h2>Clinical Text</h2>

      <textarea
        rows="8"
        cols="100"
        placeholder="Paste doctor's letter here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
        }}
      />

      <br />
      <br />

      <button
        style={{
          padding: "10px 15px",
        }}
      >
        Upload File
      </button>

      <button
        onClick={handleAnnotate}
        style={{
          marginLeft: "10px",
          padding: "10px 15px",
        }}
      >
        Annotate
      </button>

      <hr />

      <h2>Annotation Workspace</h2>

      <p>
        Active Engine: <strong>{selectedModel}</strong>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* LEFT PANEL */}

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            minHeight: "350px",
          }}
        >
          <h3>Clinical Document</h3>

          {text ? (
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.8",
              }}
            >
              {text}
            </p>
          ) : (
            <p>
              Paste a clinical document above and click Annotate.
            </p>
          )}
        </div>

        {/* RIGHT PANEL */}

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            minHeight: "350px",
          }}
        >
          <h3>Detected Entities</h3>

          {annotations.length === 0 ? (
            <p>No annotations yet.</p>
          ) : (
            annotations.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      labelColors[item.meaning_group] || "#9ca3af",
                    color: "white",
                    display: "inline-block",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    marginBottom: "10px",
                  }}
                >
                  {item.meaning_group}
                </div>

                <p>
                  <strong>Text:</strong>{" "}
                  {item.selected_text}
                </p>

                <p>
                  <strong>Model:</strong>{" "}
                  {item.model}
                </p>

                {item.score && (
                  <p>
                    <strong>Score:</strong>{" "}
                    {(item.score * 100).toFixed(2)}%
                  </p>
                )}

                <p>
                  <strong>Start:</strong>{" "}
                  {item.start}
                </p>

                <p>
                  <strong>End:</strong>{" "}
                  {item.end}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}