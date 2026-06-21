export default function EntityPanel({
  annotations,
  selectedEntity,
  setSelectedEntity,
  editedLabel,
  setEditedLabel,
  getLabelColor,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
        flex: 1,
        overflowY: "auto",
        minHeight: 0,
      }}
    >
      <div
        style={{
          background: "#f5f3ff",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "20px",
          fontWeight: "600",
          color: "#6d28d9",
        }}
      >
        Detected Entities ({annotations.length})
      </div>

      {annotations.length === 0 ? (
        <p>No entities detected.</p>
      ) : (
        annotations.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedEntity(item);
              setEditedLabel(
                item.meaning_group
              );
            }}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "15px",
              marginBottom: "15px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                backgroundColor:
                  getLabelColor(
                    item.meaning_group
                  ),
                color: "white",
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "20px",
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
                <strong>
                  Confidence:
                </strong>{" "}
                {(
                  item.score * 100
                ).toFixed(2)}
                %
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}