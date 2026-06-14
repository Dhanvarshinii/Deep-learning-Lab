export default function Home() {
    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
            <h1>Clinical NER Annotation Tool</h1>
            <p>Human-in-the-loop Clinical Entity Annotation</p>

            <hr />

            <h3>Select Model</h3>

            <select>
                <option>ClinicalBERT</option>
                <option>BioBERT</option>
                <option>scispaCY</option>
                <option>Llama 3</option>
            </select>

            <hr />

            <h3>Clinical Text</h3>

            <textarea
                rows="10"
                cols="80"
                placeholder="Paste doctor's letter here..."
            />

            <br />
            <br />

            <button>Upload File</button>

            <button style={{ marginLeft: "10px" }}>
                Annotate
            </button>

            <hr />

            <h3>Predicted Annotations</h3>

            <div>
                Dr. Smith - DOCTOR
            </div>

            <div>
                ibuprofen - DRUG
            </div>

            <div>
                03/12/2019 - DATE
            </div>
            
            <hr />

            <h3>Entity Legend</h3>

            <ul>
                <li>Date</li>
                <li>Doctor</li>
                <li>Hospital</li>
                <li>Patient</li>
                <li>Drug</li>
                <li>Disease</li>
                <li>Symptom</li>
                <li>Anatomy</li>
            </ul>

        </div>
    );
}