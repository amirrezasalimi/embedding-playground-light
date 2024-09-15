import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { OpenAI } from 'openai';
import {PCA} from 'ml-pca';


// Initialize the OpenAI client
const openai = new OpenAI({
  baseURL:"http://192.168.1.10:1234/v1",
  apiKey: 'YOUR_OPENAI_API_KEY', // Replace with your actual API key
  dangerouslyAllowBrowser: true // Note: This is not recommended for production use
});


// Define the structure of an embedding (x, y coordinate pair with input text)
interface EmbeddingPoint {
  x: number;
  y: number;
  text: string; // Add the original input text
}

const App: React.FC = () => {
  const [inputs, setInputs] = useState<string[]>(['']);
  const [embeddings, setEmbeddings] = useState<EmbeddingPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Handle change in input field
  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newInputs = [...inputs];
    newInputs[index] = event.target.value;
    setInputs(newInputs);
  };

  // Add new input field
  const addInputField = () => {
    setInputs([...inputs, '']);
  };

  // Remove input field
  const removeInputField = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  // Fetch embeddings for each input from the OpenAI API
  const fetchEmbeddings = async () => {
    setLoading(true);
    try {
      const embeddingsData: number[][] = [];

      // Loop through each input and fetch its embedding
      for (const input of inputs) {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002', // Example OpenAI embedding model
          input: input,
        });
        embeddingsData.push(response.data[0].embedding);
      }

      // Reduce embeddings to 2D
      const reducedEmbeddings = reduceTo2D(embeddingsData, inputs);
      setEmbeddings(reducedEmbeddings);
    } catch (error) {
      console.error('Error fetching embeddings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reduce the high-dimensional embeddings to 2D using PCA and keep the original text
  const reduceTo2D = (embeddings: number[][], texts: string[]): EmbeddingPoint[] => {
    const pca = new PCA(embeddings);
    const reduced = pca.predict(embeddings, {  }).to2DArray();
    return reduced.map(([x, y], index) => ({ x, y, text: texts[index] }));
  };

  // Custom tooltip component for displaying the text of the embedding
  const CustomTooltip = ({ active, payload }:any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border-gray-300 bg-white shadow-lg p-2 border rounded">
          <p className="font-medium text-sm">{`Text: ${payload[0].payload.text}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 p-6 min-h-screen">
      <h1 className="mb-4 font-bold text-3xl">Word Embeddings Visualizer</h1>

      <div className="space-y-2 mb-4 w-full max-w-lg">
        {inputs.map((input, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(index, e)}
              className="border-gray-300 p-2 border rounded w-full"
              placeholder={`Enter text ${index + 1}`}
            />
            <button
              onClick={() => removeInputField(index)}
              className="bg-red-500 hover:bg-red-700 p-2 rounded text-white"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addInputField}
          className="bg-blue-500 hover:bg-blue-700 p-2 rounded w-full text-white"
        >
          Add Input
        </button>
      </div>

      <button
        onClick={fetchEmbeddings}
        className="bg-green-500 hover:bg-green-700 mb-6 p-2 rounded w-full text-white"
        disabled={loading}
      >
        {loading ? 'Fetching Embeddings...' : 'Visualize Embeddings'}
      </button>

      {embeddings.length > 0 && (
        <ScatterChart
          width={600}
          height={400}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="X" />
          <YAxis type="number" dataKey="y" name="Y" />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Embeddings" data={embeddings} fill="#8884d8" />
        </ScatterChart>
      )}
    </div>
  );
};


export default App;