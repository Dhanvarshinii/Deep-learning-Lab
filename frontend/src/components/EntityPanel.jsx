export default function EntityPanel({
  annotations,
  selectedEntity,
  setSelectedEntity,
  setEditedLabel,
  customEditedLabel,
  setCustomEditedLabel,
  getLabelColor,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {annotations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#6b7280",
              padding: "40px 20px",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "10px",
              }}
            >
              🏷️
            </div>

            <div
              style={{
                fontWeight: "600",
              }}
            >
              No entities detected yet.
            </div>

            <div
              style={{
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              Run annotation to view extracted entities.
            </div>
          </div>
        ) : (
          annotations.map((item, index) => {
            const isSelected =
              selectedEntity &&
              selectedEntity.start ===
                item.start &&
              selectedEntity.end ===
                item.end;

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedEntity(item);

                  setEditedLabel(
                    item.meaning_group
                  );

                  if (
                    setCustomEditedLabel
                  ) {
                    setCustomEditedLabel(
                      ""
                    );
                  }
                }}
                style={{
                  background: isSelected
                    ? "#eff6ff"
                    : "#ffffff",

                  border: isSelected
                    ? "2px solid #2563eb"
                    : "1px solid #e5e7eb",

                  borderRadius: "14px",

                  padding: "16px",

                  marginBottom: "12px",

                  cursor: "pointer",

                  boxShadow: isSelected
                    ? "0 2px 8px rgba(37,99,235,0.15)"
                    : "0 1px 3px rgba(0,0,0,0.05)",

                  transition:
                    "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      getLabelColor(
                        item.meaning_group
                      ),
                    color: "white",
                    display:
                      "inline-block",
                    padding:
                      "6px 12px",
                    borderRadius:
                      "999px",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom:
                      "10px",
                  }}
                >
                  {item.meaning_group}
                </div>

                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "15px",
                    color: "#111827",
                    marginBottom: "8px",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {item.selected_text}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {item.model}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}