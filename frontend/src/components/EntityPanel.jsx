export default function EntityPanel({
    annotations,
    selectedEntity,
    setSelectedEntity,
    editedLabel,
    setEditedLabel,
    handleSaveEntity,
    getLabelColor,
  }) {
    return (
      <>
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
                setEditedLabel(item.meaning_group);
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
                  <strong>Confidence:</strong>{" "}
                  {(item.score * 100).toFixed(
                    2
                  )}
                  %
                </p>
              )}
            </div>
          ))
        )}
  
        {selectedEntity && (
          <div
            style={{
              background: "white",
              marginTop: "25px",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
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
                  width: "100%",
                }}
              >
                <option>
                  PERSON_PROVIDER
                </option>
  
                <option>
                  MEDICATION
                </option>
  
                <option>
                  DISEASE
                </option>
  
                <option>
                  SYMPTOM
                </option>
  
                <option>
                  DATE
                </option>
  
                <option>
                  HOSPITAL
                </option>
  
                <option>
                  ANATOMY
                </option>
              </select>
            </div>
  
            <p
              style={{
                marginTop: "15px",
              }}
            >
              <strong>Model:</strong>{" "}
              {selectedEntity.model}
            </p>
  
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
                  padding:
                    "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginRight: "10px",
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
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  padding:
                    "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }