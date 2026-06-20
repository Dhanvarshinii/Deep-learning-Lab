import { useState } from "react";
import { annotateText } from "../services/annotationService";
import EntityPanel from "../components/EntityPanel";
import { renderHighlightedText } from "../utils/highlightText.jsx";

export default function Home() {
  const [selectedModel, setSelectedModel] = useState(
    "Ensemble Transformer"
  );

  const [text, setText] = useState("");
  const [annotations, setAnnotations] = useState([]);
  const [selectedEntity, setSelectedEntity] =
    useState(null);

  const [editedLabel, setEditedLabel] =
    useState("");

  const colorPalette = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#ca8a04",
    "#db2777",
  ];

  const getLabelColor = (label) => {
    const labels = [
      ...new Set(
        annotations.map(
          (item) => item.meaning_group
        )
      ),
    ];

    const index = labels.indexOf(label);

    return (
      colorPalette[
        index % colorPalette.length
      ]
    );
  };

  const handleAnnotate = async () => {
    try {
      const response =
        await annotateText(
          selectedModel,
          text
        );

      console.log("ENTITIES:");
      console.table(response.entities);

      setAnnotations(
        response.entities
      );
    } catch (error) {
      console.error(
        "Backend Error:",
        error
      );
    }
  };

  const handleSaveEntity = () => {
    const updatedAnnotations =
      annotations.map((item) => {
        if (
          item.selected_text ===
            selectedEntity.selected_text &&
          item.model ===
            selectedEntity.model
        ) {
          return {
            ...item,
            meaning_group:
              editedLabel,
          };
        }

        return item;
      });

    setAnnotations(
      updatedAnnotations
    );

    setSelectedEntity({
      ...selectedEntity,
      meaning_group:
        editedLabel,
    });
  };

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "30px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            marginBottom: "10px",
            color: "#1e3a8a",
          }}
        >
          Clinical NER Annotation Tool
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#6b7280",
          }}
        >
          Human-in-the-loop Clinical
          Entity Annotation Platform
        </p>
      </div>

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

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "16px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: "25px",
        }}
      >
        <h3>Clinical Text</h3>

        <textarea
          rows="6"
          value={text}
          placeholder="Paste clinical text here..."
          onChange={(e) =>
            setText(e.target.value)
          }
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "10px",
            border:
              "1px solid #d1d5db",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <h3
          style={{
            marginBottom: "15px",
            color: "#374151",
          }}
        >
          Actions
        </h3>

        <button
          style={{
            background: "white",
            border:
              "2px solid #2563eb",
            color: "#2563eb",
            padding: "12px 22px",
            borderRadius: "10px",
            marginRight: "10px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Upload File
        </button>

        <button
          onClick={handleAnnotate}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Annotate
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "16px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
            minHeight: "400px",
          }}
        >
          <div
            style={{
              background: "#eff6ff",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "600",
              color: "#1e40af",
            }}
          >
            Clinical Document
          </div>

          <div
            style={{
              fontSize: "17px",
              lineHeight: "1.8",
              marginTop: "20px",
            }}
          >
            {text
              ? renderHighlightedText({
                  text,
                  annotations,
                  getLabelColor,
                  setSelectedEntity,
                  setEditedLabel,
                })
              : "Paste clinical text and click Annotate."}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "16px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
            minHeight: "500px",
          }}
        >
          <EntityPanel
            annotations={
              annotations
            }
            selectedEntity={
              selectedEntity
            }
            setSelectedEntity={
              setSelectedEntity
            }
            editedLabel={
              editedLabel
            }
            setEditedLabel={
              setEditedLabel
            }
            handleSaveEntity={
              handleSaveEntity
            }
            getLabelColor={
              getLabelColor
            }
          />
        </div>
      </div>
    </div>
  );
}

