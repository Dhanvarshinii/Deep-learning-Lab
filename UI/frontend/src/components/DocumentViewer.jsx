import { renderHighlightedText }
  from "../utils/highlightText";

export default function DocumentViewer({
  text,
  annotations,
  getLabelColor,
  setSelectedEntity,
  setEditedLabel,
  handleMouseUp,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
          height: "700px",
          overflowY: "auto",
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
        onMouseUp={handleMouseUp}
        style={{
          fontSize: "17px",
          lineHeight: "1.8",
          fontFamily:
            "'Segoe UI', sans-serif",
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
        : "Paste clinical text and click Annotate."
      }
      </div>
    </div>
  );
}