import { Stethoscope } from "lucide-react";

/**
 * Application header displayed at the top of the page.
 *
 * Shows the application title along with a summary of the
 * available models, detected entities, and processing time.
 */
export default function Header({
  annotations,
  processingTime,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "50px",
      }}
    >
      {/* Application title and description */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "#1f2a27",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Stethoscope
            size={42}
            strokeWidth={2.2}
            color="white"
          />
        </div>

        <div>
          <div
            style={{
              fontSize: "15px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "#2f6b60",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Human-in-the-Loop Entity Platform
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "42px",
              fontWeight: "500",
              color: "#111827",
              lineHeight: "1.05",
            }}
          >
            Clinical NER Annotation
          </h1>

          <p
            style={{
              marginTop: "14px",
              marginBottom: 0,
              color: "#707784",
              fontSize: "16px",
              lineHeight: "1.6",
              maxWidth: "780px",
            }}
          >
            Run clinical notes through multiple annotation
            models, review detected entities, and refine
            the results directly on the document.
          </p>
        </div>
      </div>

      {/* Summary statistics */}
      <div
        style={{
          display: "flex",
          gap: "45px",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          textAlign: "right",
          paddingTop: "12px",
          flexShrink: 0,
          minWidth: "420px",
        }}
      >
        {/* Available models */}
        <div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "500",
              lineHeight: "1",
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            5
          </div>

          <div
            style={{
              fontSize: "10px",
              letterSpacing: "2.5px",
              marginTop: "6px",
              color: "#9ca3af",
              textTransform: "uppercase",
            }}
          >
            Models
          </div>
        </div>

        {/* Number of detected entities */}
        <div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "500",
              lineHeight: "1",
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            {annotations.length}
          </div>

          <div
            style={{
              fontSize: "10px",
              letterSpacing: "2.5px",
              marginTop: "6px",
              color: "#9ca3af",
              textTransform: "uppercase",
            }}
          >
            Entities
          </div>
        </div>

        {/* Total processing time */}
        <div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "500",
              lineHeight: "1",
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            {processingTime ?? "--"} s
          </div>

          <div
            style={{
              fontSize: "10px",
              letterSpacing: "2.5px",
              marginTop: "6px",
              color: "#9ca3af",
              textTransform: "uppercase",
            }}
          >
            Processing Time
          </div>
        </div>
      </div>
    </div>
  );
}