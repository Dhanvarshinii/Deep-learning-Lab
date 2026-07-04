import { renderHighlightedText } from "../utils/highlightText";

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
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        height: "700px",
        overflowY: "auto",
      }}
    >
      {/* Heading */}
      <div
        style={{
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e40af",
          marginBottom: "18px",
        }}
      >
        Clinical Document
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          marginBottom: "18px",
        }}
      />

      {/* Entity Legend */}
      {annotations.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[...new Set(annotations.map((a) => a.meaning_group))].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "4px",
                    backgroundColor: getLabelColor(label),
                  }}
                />

                <span
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    fontWeight: "500",
                  }}
                >
                  {label}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* Clinical Text */}
      <div
        onMouseUp={handleMouseUp}
        style={{
          fontSize: "17px",
          lineHeight: "1.8",
          fontFamily: "'Segoe UI', sans-serif",
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
          : "Paste clinical text and click Run Annotation."}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        Select any text to tag it as a new entity. Click an existing highlighted
        entity to review or edit its annotation.
      </div>
    </div>
  );
}