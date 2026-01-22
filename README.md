# FacadeBreaker - AI-Based Fake News Detection System

## 🎯 Overview

FacadeBreaker is an advanced AI-powered platform designed to combat misinformation by analyzing news articles, fact-checking claims, and detecting deepfakes/AI-generated images. Built with Next.js and powered by Google's Gemini AI, this tool helps users verify the authenticity of information in the digital age.

## ✨ Features

### 📰 Fact/News Checker
- Real-time fact-checking of news articles and claims
- URL analysis with web scraping capabilities
- Credibility scoring and source verification
- Interactive chat interface for follow-up questions
- Comprehensive analysis with citations and references

### 🖼️ Deepfake/AI Detector
- Advanced image authenticity analysis
- Detection of AI-generated or manipulated images
- Multiple detection techniques including:
  - Metadata analysis
  - Visual artifact detection
  - Pixel-level pattern recognition
  - Deep learning-based classification
- Confidence scores and detailed reports
- Support for various image formats (JPEG, PNG, WebP, etc.)

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI/ML**: 
  - Google Gemini AI (Primary)
  - Support for OpenAI, Anthropic Claude, and Groq
  - Custom Python image analysis scripts
- **Web Scraping**: Axios, Cheerio
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/RaveeshSehrawat/AI-Based-Fake-News-Detection-System.git
cd AI-Based-Fake-News-Detection-System
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Features in Detail

### Theme Support
- Light and Dark mode toggle
- Custom gradient backgrounds
- Responsive design for all screen sizes

### Chat Interface
- Real-time streaming responses
- Message history with markdown support
- Code syntax highlighting
- Copy functionality for responses

### Image Analysis
- Drag-and-drop image upload
- Real-time analysis progress
- Detailed authenticity reports
- Visual indicators for detection confidence

## 🛠️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── analyze/       # News analysis endpoint
│   │   └── image-auth/    # Image authentication endpoint
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ChatContainer.tsx  # Chat interface
│   └── ImageAnalyzer.tsx  # Image analysis interface
├── context/              # React context providers
│   └── ThemeContext.tsx  # Theme management
├── lib/                  # Utility libraries
├── python_analysis/      # Python scripts for image analysis
│   └── image_auth.py     # Deep learning image authentication
├── public/               # Static assets
└── temp/                 # Temporary file storage

```

## 🔑 API Keys

To use FacadeBreaker, you'll need API keys from one or more of these providers:

- **Google Gemini** (Recommended): [Get API Key](https://makersuite.google.com/app/apikey)
## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Raveesh Sehrawat**

- GitHub: [@RaveeshSehrawat](https://github.com/RaveeshSehrawat)

## 🙏 Acknowledgments

- Google Gemini AI for powering the core analysis
- Next.js team for the amazing framework
- All contributors and supporters of this project

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Made with ❤️ to combat misinformation**