# AI Predictive Maintenance System

An end-to-end Machine Learning web application allowing live input and system health diagnosis based on equipment monitoring metrics.

## Features
- **FastAPI Backend**: Seamless Random Forest Classifier integration, predicting machinery failure out of given hardware logs. 
- **Auto Data Synthesis**: The API creates its own mock system history if none is available on cold start. 
- **React + Vite Frontend**: Vanilla CSS modern Dashboard equipped with Recharts visualization and Lucide indicators.

---

## 🚀 Local Setup

### 1. Backend (FastAPI)
Run the following commands starting from the project's root:

```bash
cd backend
python -m venv venv
# For Windows Powershell:
.\venv\Scripts\activate
# For Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
The Backend will boot at `http://localhost:8000`.

### 2. Frontend (React + Vite)
In a separate terminal, move into the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```
The application will launch on your local Vite port (usually `http://localhost:5173`). Have the backend running locally first so that the initial ML Model `/train` boots correctly upon loading.

---

## 📦 Deployment Instructions

### Backend (Render / Railway)
1. Connect your repository to **Render** or **Railway**.
2. Make sure you set the active directory or root correctly if deploying just the backend folder.
3. Set the start command to: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` (adjust the path to main.py based on your repo root).
4. Deploy the server and grab the generated URL (e.g., `https://my-fastapi.render.com`).

### Frontend (Vercel / Netlify)
1. Connect your repository to **Vercel** or **Netlify** choosing the `frontend/` directory.
2. Set the Build Command to `npm run build` and the Output Directory to `dist`.
3. In the environment variables settings on Vercel/Netlify, create `VITE_API_URL` and set it to your Backend URL obtained above.
4. Deploy the application!
