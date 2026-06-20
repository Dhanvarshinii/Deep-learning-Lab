import { useState, useRef } from "react";
import { annotateText } from "../services/annotationService";
import EntityPanel from "../components/EntityPanel";
import { renderHighlightedText } from "../utils/highlightText.jsx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

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

  const fileInputRef = useRef(null);

  const [uploadedFile, setUploadedFile] =
  useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

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
      setIsLoading(true);
  
      const inputText =
      uploadedFile?.text || text;

    console.log("INPUT TEXT:");
    console.log(inputText);

    console.log("TEXT LENGTH:");
    console.log(inputText.length);
  
    const response = await annotateText(
      selectedModel,
      inputText
    );
    
    if (response.error) {
      alert(response.error);
      setIsLoading(false);
      return;
    }
  
      setAnnotations(
        response.entities
      );
  
      setText(inputText);
    } catch (error) {
      console.error(
        "Backend Error:",
        error
      );
    } finally {
      setIsLoading(false);
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

  const handleClearAll = () => {
    setText("");
    setAnnotations([]);
    setSelectedEntity(null);
    setEditedLabel("");
    setUploadedFile(null);
  };

  const handleDownloadJSON = () => {
    const exportData = {
      document_name:
        uploadedFile?.name ||
        "manual_input",
  
      annotation_model:
        selectedModel,
  
      annotations:
        annotations,
    };
  
    const jsonString =
      JSON.stringify(
        exportData,
        null,
        2
      );
  
    const blob = new Blob(
      [jsonString],
      {
        type:
          "application/json",
      }
    );
  
    const url =
      URL.createObjectURL(blob);
  
    const link =
      document.createElement("a");
  
    link.href = url;
  
    link.download =
      "annotations.json";
  
    link.click();
  
    URL.revokeObjectURL(url);
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
  
    if (!file) return;
  
    // TXT FILE
    if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
  
      reader.onload = (e) => {
        setUploadedFile({
          name: file.name,
          text: e.target.result,
        });
      };
  
      reader.readAsText(file);
      return;
    }
  
    // PDF FILE
    if (file.name.endsWith(".pdf")) {
      try {
        const arrayBuffer =
          await file.arrayBuffer();
  
        const pdf =
          await pdfjsLib.getDocument({
            data: arrayBuffer,
          }).promise;
  
        let extractedText = "";
  
        for (
          let pageNum = 1;
          pageNum <= pdf.numPages;
          pageNum++
        ) {
          const page =
            await pdf.getPage(pageNum);
  
          const textContent =
            await page.getTextContent();
  
          const pageText =
            textContent.items
              .map((item) => item.str)
              .join(" ");
  
          extractedText +=
            pageText + "\n\n";
        }
  
        setUploadedFile({
          name: file.name,
          text: extractedText,
        });
      } catch (error) {
        console.error(
          "PDF extraction failed:"
        );
        
        console.error(error);
        
        alert(
          "PDF Error: " +
            (error?.message || error)
        );
      }
    }
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
          value={
            uploadedFile
              ? ""
              : text
          }
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

        <input
          type="file"
          accept=".txt,.pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        <button
          onClick={() =>
            fileInputRef.current.click()
          }
          style={{
            background: "white",
            border: "2px solid #2563eb",
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
          disabled={isLoading}
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
          {
            isLoading
              ? "Annotating..."
              : "Annotate"
          }
        </button>

        <button
        onClick={handleClearAll}
        style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          padding: "12px 22px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
          marginLeft: "10px",
        }}
      >
        ↺ Clear All
      </button>

      <button
        onClick={
          handleDownloadJSON
        }
        disabled={
          annotations.length === 0
        }
        style={{
          background: "#16a34a",
          color: "white",
          border: "none",
          padding: "12px 22px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
          marginLeft: "10px",
        }}
      >
        ⬇ Export JSON
      </button>

      </div>

      {
        uploadedFile && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#f3f4f6",
              borderRadius: "10px",
              display: "inline-block",
            }}
          >
            📄 {uploadedFile.name}
          </div>
        )
      }

      {
        isLoading && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              fontWeight: "600",
              color: "#2563eb",
            }}
          >
            Processing document and extracting entities...
          </div>
        )
      }
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

