import { Stethoscope } from "lucide-react";
export default function Header() {
    return (
        <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
            style={{
                width: "76px",
                height: "76px",
                borderRadius: "20px",
                background: "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow:
                "0 4px 12px rgba(0,0,0,0.15)",
            }}
            >
            <Stethoscope
                size={38}
                strokeWidth={2.2}
                color="white"
            />
            </div>
      
        <div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              color: "#111827",
              margin: 0,
            }}
          >
            Clinical NER Annotation Tool
          </h1>
      
          <p
            style={{
              marginTop: "6px",
              color: "#6b7280",
              fontSize: "15px",
              lineHeight: "1.5",
            }}
          >
            Extract clinical entities from medical documents using
            AI-powered annotation approaches and refine predictions
            through human review.
          </p>
        </div>
      </div>
    );
  }