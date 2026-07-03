export default function SelectedEntityPanel({
    selectedEntity,
    editedLabel,
    setEditedLabel,
    customEditedLabel,
    setCustomEditedLabel,
    handleSaveEntity,
    setSelectedEntity,
    annotations,
  }) {
    if (!selectedEntity) {
      return null;
    }
  
    const labels = [
      ...new Set(
        annotations.map(
          (item) =>
            item.meaning_group
        )
      ),
    ];
  
    return (
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "16px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
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
          Selected Entity
        </div>
  
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
            Existing Labels
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
              width: "100%",
              border:
                "1px solid #d1d5db",
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
        </div>
  
        <div
          style={{
            marginTop: "15px",
          }}
        >
          <strong>
            Custom Label
          </strong>
  
          <br />
  
          <input
            type="text"
            placeholder="Enter custom label..."
            value={customEditedLabel}
            onChange={(e) =>
              setCustomEditedLabel(
                e.target.value
              )
            }
            style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "8px",
              width: "100%",
              boxSizing:
                "border-box",
              border:
                "1px solid #d1d5db",
            }}
          />
        </div>
  
        {selectedEntity.score && (
          <p
            style={{
              marginTop: "15px",
            }}
          >
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
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={
              handleSaveEntity
            }
            style={{
              background:
                "#16a34a",
              color: "white",
              border: "none",
              padding:
                "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Save Changes
          </button>
  
          <button
            onClick={() =>
              setSelectedEntity(
                null
              )
            }
            style={{
              background:
                "#dc2626",
              color: "white",
              border: "none",
              padding:
                "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }