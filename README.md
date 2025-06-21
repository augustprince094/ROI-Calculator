# Broiler ROI Optimizer

This is a Next.js application designed for broiler farmers to calculate and optimize their Return on Investment (ROI) when using feed additives. The application provides a simple interface to input farm data and receive detailed financial metrics, along with AI-powered suggestions to enhance profitability.

## Key Features

- **ROI Calculation:** Input your farm's data (number of broilers, weight, mortality rate, FCR) to calculate the financial impact of using different feed additives.
- **Additive Comparison:** Easily switch between different Jefo Solutions ("Additive A", "Additive B", "Additive C") to see how each one affects your FCR and overall costs.
- **Visual Results:** A clear, interactive bar chart compares your baseline cost per kg of live weight to the cost with the selected additive, making it easy to see the savings.
- **AI-Powered Smart Suggestions:** The application leverages Google's Gemini model via Genkit to analyze your specific situation and recommend the optimal feed additive strategy for maximizing your ROI.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **UI Library:** [React](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Charting:** [Recharts](https://recharts.org/)
- **Generative AI:** [Firebase Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini model

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation & Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    You will need a Google AI API key for the "Smart Suggestions" feature to work. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey). Add your key to the `.env` file at the root of your project:
    ```
    GOOGLE_API_KEY="your_google_api_key_here"
    ```

3.  **Run the development servers:**
    This application requires two processes to run concurrently: the Next.js frontend and the Genkit AI server.

    - **In your first terminal, run the Next.js app:**
      ```bash
      npm run dev
      ```
      This will start the web application, usually on `http://localhost:9002`.

    - **In a second terminal, run the Genkit server:**
      ```bash
      npm run genkit:dev
      ```
      This starts the local server for your Genkit flows, enabling the AI features.

    Now, you can open `http://localhost:9002` in your browser to use the application.

## Project Structure

Here's a brief overview of the key directories and files:

-   `src/app/page.tsx`: The main page component that ties everything together.
-   `src/components/calculator-panel.tsx`: The form component where users input their farm and additive data.
-   `src/components/results-panel.tsx`: The component that displays the calculated metrics, chart, and AI suggestions.
-   `src/lib/calculator.ts`: Contains the core business logic for all financial calculations (ROI, cost savings, etc.).
-   `src/lib/additive-data.ts`: A static data file holding the properties for each available feed additive (cost, inclusion rate, FCR improvement).
-   `src/ai/flows/smart-suggestions.ts`: The Genkit flow that defines the prompt and logic for generating AI-powered recommendations.
-   `src/ai/genkit.ts`: Configuration file for initializing Genkit and the Google AI plugin.
