# Palmistry-Tarot-Intelligence-Platform-Team-3
# 🔮 AI Palmistry & Tarot Intelligence Platform

An AI-powered web application that combines **Palmistry Analysis** and
**Tarot Reading** with modern web technologies and AI services. The
platform provides an interactive environment where users can explore
palm-line analysis, tarot readings, personalized dashboards, reading
history, and spiritual insights.

> **Project Type:** Internship Project\
> **Purpose:** Educational and research-oriented application

------------------------------------------------------------------------

## 📌 Project Overview

The **AI Palmistry & Tarot Intelligence Platform** is designed to bring
traditional palmistry and tarot practices into a modern digital
experience.

The application provides separate user experiences for different roles
and includes:

-   ✋ Palm scanning and palm-line analysis
-   🃏 Interactive tarot reading
-   🤖 AI-assisted interpretation and insight generation
-   👤 User authentication and profile management
-   📊 Personalized user dashboard
-   🔮 Reader/Practitioner dashboard
-   📜 Reading and report history
-   💾 Local database and automatic storage management
-   📷 Camera access for palm image capture
-   📈 Analytics and role-based dashboards

------------------------------------------------------------------------

## ✨ Key Features

### ✋ AI Palmistry

-   Capture or upload palm images using camera access.
-   Analyze palm features and lines.
-   Generate structured palmistry insights.
-   Store palm-analysis results for later reference.

### 🃏 Tarot Reading

-   Interactive virtual tarot reading experience.
-   Tarot card selection and spread-based readings.
-   AI-assisted interpretation of cards.
-   Reading session history and saved reports.

### 👤 User Dashboard

The User Dashboard provides a personalized workspace containing:

-   User profile information
-   Saved reports
-   Reading history
-   Spiritual goals
-   Focus areas
-   Palmistry and tarot reading options
-   Report management
-   Personalized insights

### 🔮 Reader Dashboard

The Reader Dashboard provides tools for tarot practitioners/readers,
including:

-   Reader activity overview
-   Client/user-related information
-   Reading statistics
-   Session management
-   Analytics
-   Reader-focused controls

### 🔐 Authentication

The application includes authentication-related components for:

-   User login
-   User account management
-   Role-based application access
-   User credential handling

### 💾 Data & Storage Management

The project includes dedicated data and database modules for:

-   User profiles
-   User credentials
-   Palmistry data
-   Tarot data
-   Reports
-   Notifications
-   Reading sessions
-   Automatic storage management
-   Backup snapshots
-   Data export/import

### 📷 Camera Integration

The platform requests camera permission for palm scanning and image
capture.

------------------------------------------------------------------------

## 🛠️ Technology Stack

### Frontend

-   **React.js**
-   **TypeScript**
-   **HTML5**
-   **CSS3**
-   **Lucide React for icons**
-   **Component-based UI architecture**

### AI

-   **Google Gemini API**
-   **Server-side Gemini API integration for AI-powered functionality**

### Data & Storage

-   **TypeScript-based application data modules**
-   **Local/mock database modules**
-   **Automatic storage management**
-   **Browser storage and backup/export functionality where applicable**

### Development Tools

-   **Node.js**
-   **npm**
-   **Vite**
-   **Git**
-   **GitHub**
-   **Visual Studio Code**

------------------------------------------------------------------------

## 📂 Project Structure

``` text
Palmistry-Tarot-Intelligence-Platform/
│
├── src/
│   ├── components/
│   │   ├── Dashboards/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ConsultantDashboard.tsx
│   │   │   ├── ReaderDashboard.tsx
│   │   │   └── UserDashboard.tsx
│   │   │
│   │   ├── AuthModal.tsx
│   │   ├── AutoStorageWidget.tsx
│   │   ├── PalmScanner.tsx
│   │   ├── TarotStudio.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   │
│   ├── data/
│   │   ├── mockDatabase.ts
│   │   ├── palmistryData.ts
│   │   ├── tarotData.ts
│   │   ├── userCredentials.ts
│   │   └── dbServer.ts
│   │
│   ├── database/
│   │   ├── autoStorageManager.ts
│   │   ├── userCredentialsDatabase.ts
│   │   └── userDatabase.ts
│   │
│   ├── utils/
│   │
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── types.ts
│
├── public/
│
├── metadata.json
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Clone the Repository

``` bash
git clone https://github.com/springboardmentor00/Palmistry-Tarot-Intelligence-Platform-Team-3.git
```

### 2. Navigate to the Project

``` bash
cd Palmistry-Tarot-Intelligence-Platform-Team-3
```

### 3. Install Dependencies

``` bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file based on `.env.example` and configure the required
AI/API settings.

**Do not commit API keys or other secrets to GitHub.**

### 5. Start the Development Server

``` bash
npm run dev
```

Open the local development URL shown in the terminal, commonly:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

## 🔑 AI Integration

The platform is designed to use a **server-side Gemini API integration**
for AI-powered functionality.

The AI layer can be used to process application data and generate
natural-language interpretations and insights.

API credentials should be stored securely in environment variables
rather than directly inside source code.

------------------------------------------------------------------------

## 🧩 Major Application Modules

  Module                 Purpose
  ---------------------- -------------------------------------------
  Authentication         Login and account access
  User Dashboard         Personalized user workspace
  Reader Dashboard       Reader/practitioner workspace
  Admin Dashboard        Administrative overview
  Consultant Dashboard   Consultant-oriented functionality
  Palm Scanner           Palm image capture and analysis
  Tarot Studio           Interactive tarot reading
  Auto Storage Widget    Storage status and backup/export controls
  User Database          User-specific application data
  Mock Database          Initial/demo application data
  Palmistry Data         Palmistry-related data
  Tarot Data             Tarot card and reading data

------------------------------------------------------------------------

## 🌿 GitHub Branch Workflow

This project is developed collaboratively using Git and GitHub.

Each team member works on their own branch before changes are reviewed
and merged.

Example:

``` text
main
│
├── Subhransu Sekhar Barik
├── Harshika Darda
├── Pranesh
├── Havila Hydi Gurram
├── Kapuganti Venkata Kowshik
├── Akshaya Tarumani
└── Milkal
```

### Basic Workflow

``` bash
git checkout -b your-branch-name
```

Make your changes, then:

``` bash
git add <file-name>
git commit -m "Describe your changes"
git push origin your-branch-name
```

Changes can then be reviewed through a Pull Request before being merged
into `main`.

------------------------------------------------------------------------

## 👥 Team

Developed collaboratively as a **B.Tech Computer Science & Engineering
project**.

### Team Members

-   Subhransu Sekhar Barik
-   Harshika Darda
-   Pranesh
-   Havila Hydi Gurram
-   Kapuganti Venkata Kowshik
-   Akshaya Tarumani
-   Milakal

------------------------------------------------------------------------

## 🔮 Future Enhancements

Possible future improvements include:

-   Advanced computer-vision-based palm-line detection
-   Improved AI interpretation models
-   More tarot spreads and reading modes
-   Multilingual support
-   Voice-based AI assistant
-   Advanced analytics
-   Astrology and numerology modules
-   Mobile application
-   Cloud-based user data synchronization
-   Enhanced authentication and authorization
-   Production-grade database integration

------------------------------------------------------------------------

## ⚠️ Disclaimer

This application is developed for **educational and research purposes**.
Palmistry and tarot interpretations presented by the platform should be
treated as entertainment or reflective content and should not be
considered professional medical, financial, legal, or other expert
advice.

------------------------------------------------------------------------

## 📄 License

**MIT License**

**Copyright (c) 2026 springboardmentor00**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
------------------------------------------------------------------------

## 📧 Contact

For project-related queries, please contact the development team through
the project's GitHub repository.

------------------------------------------------------------------------

⭐ **If you find this project interesting, consider giving the
repository a star!**
