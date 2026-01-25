# Medical AI Assistant

A professional healthcare platform leveraging Google's Gemini AI for intelligent prescription analysis, symptom checking, and personalized health recommendations.

---

## 🚀 Quick Start (The "One Command" Way)

If you have **Node.js** and **MongoDB** installed, just run these commands in two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend && npm install && npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm install && npm run dev
```

---

## 🛠️ Step-by-Step Setup

### Prerequisites
1.  **Node.js**: [Download Here](https://nodejs.org/) (Version 18+ recommended)
2.  **MongoDB**: Make sure MongoDB is running locally.

### 1. Backend Setup (API & Server)
The backend handles AI processing and database connections.

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a file named `.env` in the `backend` folder and paste this:
    ```env
    PORT=5010
    MONGODB_URI=mongodb://localhost:27017/healthcare_db
    JWT_SECRET=mysecretkey123
    GEMINI_API_KEY=Put_Your_Gemini_Key_Here
    ```
    *(Get your free Gemini Key from [Google AI Studio](https://aistudio.google.com/))*

4.  Start the server:
    ```bash
    npm start
    ```
    *You should see: `Server running on port 5010` and `MongoDB connected`.*

### 2. Frontend Setup (User Interface)
The frontend is the web interface you interact with.

1.  Open a **new terminal** and navigate to the frontend:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the app:
    ```bash
    npm run dev
    ```
4.  Open the link shown (usually `http://localhost:5173`) in your browser.

---

## 📂 Project Structure

- **`frontend/`**: The React web application source code.
- **`backend/`**: Node.js/Express server and API logic.
- **`datasets/`**: Reference medical datasets used for training/validation.
- **`unused_code/`**: Archived reference code not currently in use.

## ✨ Key Features

- **Prescription Reader**: AI reads doctor's handwriting from images.
- **Symptom Analyzer**: Describe your symptoms to get instant advice.
- **Health Dashboard**: Track your medical history and vitals.
- **Secure**: Data is stored locally on your machine via MongoDB.

