const models = [
    "ClinicalBERT",
    "BioBERT",
    "scispaCY",
    "Llama 3"
];

<select>
    {models.map(model => (
        <option key={model}>{model}</option>
    ))}
</select>