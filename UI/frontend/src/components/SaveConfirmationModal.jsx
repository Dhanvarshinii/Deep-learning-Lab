export default function SaveConfirmationModal({
    showSavePopup,
    selectedEntity,
    editedLabel,
    customEditedLabel,
    editedScore,
    handleSaveEntity,
    setShowSavePopup,
  }) {
    if (!showSavePopup) {
      return null;
    }
  
    const finalLabel =
      customEditedLabel.trim() || editedLabel;
    
    const labelChanged =
        selectedEntity?.meaning_group !== finalLabel;

        const confidenceChanged =
        selectedEntity?.score !== undefined &&
        editedScore !== "" &&
        Number(editedScore) !==
            Math.round(selectedEntity.score * 100);

        const hasChanges =
        labelChanged || confidenceChanged;

    return (
      <>
        {/* Overlay */}
        <div
          onClick={() => setShowSavePopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.45)",
            backdropFilter: "blur(3px)",
            zIndex: 999,
          }}
        />
  
        {/* Modal */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "440px",
            background: "white",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 20px 45px rgba(0,0,0,.18)",
            zIndex: 1000,
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Save Changes
          </h2>
  
          <p
            style={{
                color: "#6b7280",
                lineHeight: "1.6",
                marginBottom: "20px",
            }}
            >
            {hasChanges
                ? "Are you sure you want to apply these changes to the selected annotation?"
                : "No changes have been made to this annotation."}
            </p>
  
          <div
            style={{
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              Selected Entity
            </div>
  
            <div
              style={{
                fontWeight: "600",
                color: "#111827",
                marginBottom: "16px",
              }}
            >
              {selectedEntity?.selected_text}
            </div>
  
            {selectedEntity?.meaning_group !== finalLabel && (
                <div
                    style={{
                    fontSize: "14px",
                    color: "#374151",
                    marginBottom: "8px",
                    }}
                >
                    <strong>Label:</strong>{" "}
                    {selectedEntity?.meaning_group}
                    {" → "}
                    {finalLabel}
                </div>
                )}
            {selectedEntity?.score !== undefined &&
            editedScore !== "" &&
            Number(editedScore) !==
            Math.round(selectedEntity.score * 100) && (
              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <strong>Confidence:</strong>{" "}
                {(selectedEntity.score * 100).toFixed(0)}%
                {" → "}
                {editedScore}%
              </div>
            )}
          </div>
  
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              onClick={() =>
                setShowSavePopup(false)
              }
              style={{
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                padding: "10px 18px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
  
            <button
                disabled={!hasChanges}
                onClick={() => {
                    handleSaveEntity();
                    setShowSavePopup(false);
                }}
                style={{
                    background: hasChanges
                    ? "#16a34a"
                    : "#9ca3af",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    cursor: hasChanges
                    ? "pointer"
                    : "not-allowed",
                    opacity: hasChanges ? 1 : 0.7,
                }}
                >
                Save Changes
                </button>
          </div>
        </div>
      </>
    );
  }