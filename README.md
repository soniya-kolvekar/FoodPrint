# FoodPrint 🍳

FoodPrint is a modern, high-fidelity web application designed to help home chefs track inventory, reduce food waste, and discover incredible recipes. It helps you manage your physical fridge using a clean, beautifully designed digital interface and automated notifications.

## 🚀 Key Features

- **Snapshot Pantry:** Organize your digital pantry and manage product expirations securely.
- **Recipe Rescue:** Generate zero-waste recipes utilizing ingredients expiring today.
- **Expiry Heatmap:** Visualize grocery lifespans with 30-day analytics.
- **Secure Authentication:** High-fidelity authenticated user profiles utilizing Firebase.
- **Bento Core Structure:** Clean, pastel-based glassmorphism grid layouts built natively out of the box using modern Tailwind v4 rules.

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS v4, Framer Motion
- **Backend Infrastructure:** Firebase Auth & Admin SDK, Hosted Server API Logic
- **UI Architecture:** Custom Component Library integrated with Lucide Icons

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project Setup

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/foodprint.git
   cd foodprint
   ```

2. **Setup the Frontend Environment:**
   Navigate into `/frontend` and copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Populate with your exact Firebase configuration keys
   npm install
   npm run dev
   ```

3. **Setup the Server Environment:**
   Navigate into `/server`, install requirements, and map your credentials:
   ```bash
   cd ../server
   cp .env.example .env
   # Add your absolute path to firebase-service-account.json and 3rd-party API keys
   npm install
   npm run dev
   ```

## ⚖️ License

This project is open-sourced under the MIT License - see the [LICENSE](LICENSE) file for details.
