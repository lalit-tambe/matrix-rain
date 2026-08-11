# 🟢 Matrix Rain: AI Gesture Simulation

Welcome to the real world. 

This project is a high-performance, interactive **Matrix Digital Rain** engine built with React and HTML5 Canvas. Unlike a standard screensaver, this simulation is fully alive—it watches you. Using Google's **MediaPipe Vision AI**, the application tracks your hand movements through your webcam in real-time, allowing you to manipulate the very fabric of the simulation using nothing but hand gestures.

---

## 🕶️ The Experience

When you boot the system, you'll be greeted by a hacker-themed intro sequence. You'll be presented with a choice:
- **The Red Pill**: Stay in Wonderland, and see how deep the rabbit hole goes.
- **The Blue Pill**: The story ends, you wake up in your bed and believe whatever you want to believe.

*(Hint: Use the **PINCH** gesture to make your choice).*

Once inside the Matrix, your webcam feed will appear in the **AI HUD** at the bottom right. Raise your hand to the camera to seize control of the rain.

## 🦾 Gesture Controls

The AI engine continuously scans your webcam feed for specific hand landmarks. Try the following gestures to bend the rules of the Matrix:

| Gesture | Command | Effect |
| :--- | :--- | :--- |
| ✋ **OPEN PALM** | `SLOW-MO` | Enters "Bullet Time", drastically slowing down the rain to a crawl. |
| ✊ **FIST** | `PAUSE` | Freezes the simulation completely in place. |
| ✌️ **PEACE SIGN** | `BURST` | Triggers a massive burst of new code streams cascading down the screen. |
| 🤏 **PINCH** | `GLITCH` | Causes a localized reality glitch, corrupting the colors of the rain streams. |
| 👆 **SWIPE UP** (Index Extended) | `OVERRIDE` | Overrides the simulation gravity, causing the code streams to accelerate uncontrollably. |

---

## 🚀 How to Run Locally

You don't need to be an Operator to run this code. 

### Prerequisites
- Node.js (v18 or higher)
- A working Webcam (Required for the AI gesture tracking)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/lalit-tambe/matrix-rain.git
   cd matrix-rain
   ```

2. Install dependencies (using clean install for speed):
   ```bash
   npm ci
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser. **You must allow webcam permissions** when prompted, or the AI will not be able to track your gestures.

---

## 🛠️ Technology Stack
- **Framework:** React 19 + Vite
- **AI/ML:** Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- **Graphics:** Raw HTML5 Canvas 2D API for high FPS rendering without DOM overhead.
- **Styling:** Pure CSS with glassmorphism and retro terminal aesthetics.
- **CI/CD:** Automated GitHub Actions deployment to GitHub Pages.

## 🌐 Hosted Version
Experience the simulation directly in your browser without downloading anything:
**[Launch Matrix Rain](https://lalit-tambe.github.io/matrix-rain/)**

> *"I can only show you the door. You're the one that has to walk through it."*
