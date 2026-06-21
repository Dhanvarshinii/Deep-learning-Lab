export default function SelectedEntityPanel({
    selectedEntity,
    editedLabel,
    setEditedLabel,
    handleSaveEntity,
    handleDeleteEntity,
    showDeletePopup,
    setShowDeletePopup,
    setSelectedEntity,
    annotations,
  }) {
    if (!selectedEntity) {
      return null;
    }

    const labels = [
        ...new Set(
          annotations.map(
            (item) => item.meaning_group
          )
        ),
      ];
  
    return (
      <div
        style={{
          background: "white",
          marginTop: "25px",
          padding: "25px",
          borderRadius: "16px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
            height: "220px",
            overflowY: "auto",
        }}
      >
        <h3>Selected Entity</h3>
  
        <p>
          <strong>Text:</strong>{" "}
          {selectedEntity.selected_text}
        </p>
  
        <div
          style={{
            marginTop: "15px",
          }}
        >
          <strong>
            Meaning Group
          </strong>
  
          <br />
  
          <select
            value={editedLabel}
            onChange={(e) =>
              setEditedLabel(
                e.target.value
              )
            }
            style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "8px",
              width: "250px",
            }}
          >
            {labels.map((label) => (
            <option
                key={label}
                value={label}
                >
                {label}
                </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Or enter custom label"
            value={editedLabel}
            onChange={(e) =>
                setEditedLabel(e.target.value)
            }
            style={{
                width: "250px",
                marginTop: "10px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
            }}
            />
        </div>
  
        {selectedEntity.score && (
          <p>
            <strong>
              Confidence:
            </strong>{" "}
            {(
              selectedEntity.score *
              100
            ).toFixed(2)}
            %
          </p>
        )}
  
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <button
            onClick={
                handleSaveEntity
            }
            style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "10px",
            }}
            >
            Save Changes
            </button>
  
            <button
                onClick={() =>
                    setShowDeletePopup(true)
                }
                style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginRight: "10px",
                }}
                >
                Delete
                </button>

            <button
            onClick={() =>
                setSelectedEntity(null)
            }
            style={{
                background: "#6b7280",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                cursor: "pointer",
            }}
            >
            Close
            </button>
        </div>
      </div>
    );
  }