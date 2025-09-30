# ⚡ LT Line Fault Detection & Isolation

[![Made with Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white)](https://www.oracle.com/java/)
[![Made with Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Frontend React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Project Overview
The **LT Line Fault Detection & Isolation System** is designed to monitor, detect, and isolate faults in **Low Tension (LT) distribution lines** using:
- Smart meters for real-time consumer status.
- IoT sensors on feeders and transformers.
- GIS mapping for network topology.
- Machine learning models for fault classification.
- Web-based dashboard for visualization and control.

This system helps reduce downtime, improves reliability, and supports **smart grid initiatives**.

---

  Features
✅ Real-time fault detection on LT lines  
✅ Automatic fault isolation & rerouting  
✅ Smart meter & sensor integration  
✅ GIS-based visualization of distribution network  
✅ Web dashboard (React + Node.js/Python backend)  
✅ Data analytics & ML-based prediction  

---

## 🏗️ Tech Stack
- **Frontend**: React.js, Tailwind CSS, D3.js  
- **Backend**: Node.js / Python (Flask or FastAPI)  
- **Database**: MongoDB, PostgreSQL (for GIS data)  
- **Machine Learning**: Scikit-learn, Pandas, Numpy  
- **Simulation Support**: MATLAB / OpenModelica for line control logic  

---

## 📂 Project Structure
```
LT-line-fault79/
│── backend/          # Backend APIs (Node.js/Python)
│── frontend/         # React.js Dashboard
│── datasets/         # Sample datasets (CSV, JSON)
│── models/           # ML models for fault detection
│── docs/             # Documentation
│── simulations/      # MATLAB/OpenModelica simulations
│── README.md         # Project description
```

---
## 

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/innohack45-cell/LT-line-fault79.git
cd LT-line-fault79
```

### 2️⃣ Backend Setup (Node.js Example)
```bash
cd backend
npm install
npm run dev
```

### 3️⃣ Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Python ML Environment
```bash
cd models
pip install -r requirements.txt
```

### 5️⃣ Install Openmodelica Software
   from https://build.openmodelica.org/omc/builds/windows/releases/1.25/4/64bit/
   OpenModelica-v1.25.4-64bit.exe
   and load all .mo files from mattancharry GIS map replica Folder.
---

## 📊 Dataset
- Consumer smart meter logs  
- LT feeder & transformer sensor data  
- Fault passage indicator records  
- GIS topology data  

---

## 🔮 Future Scope
- Integration with **SCADA systems**  
- Predictive fault detection using AI  
- Automated switching via IoT relays  
- Cloud deployment for scalability  

---

## 🤝 Contributing
Contributions are welcome! Please fork the repo and create a PR.

---

## 📜 License
This project is licensed under the **MIT License**.

---

## 👥 Team
- Developed as part of **SIH 2025 Hackathon** by Team *InnoHack45*


