import axios from "axios";

export const annotateText = async (
  model,
  text
) => {
  const response = await axios.post(
    "http://127.0.0.1:8000/predict",
    {
      model,
      text,
    }
  );

  return response.data;
};