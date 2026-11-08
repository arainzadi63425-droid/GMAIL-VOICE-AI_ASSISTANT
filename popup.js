document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const authCard = document.getElementById('auth-card');
  const agentCard = document.getElementById('agent-card');
  const userInfo = document.getElementById('user-info');
  const generateBtn = document.getElementById('generate-btn');
  const statusText = document.getElementById('status-text');
  const resultCard = document.getElementById('result-card');
  const emailPreview = document.getElementById('email-preview');
  const openGmailBtn = document.getElementById('open-gmail-btn');
  const speakBtn = document.getElementById('speak-btn');
  const micBtn = document.getElementById('mic-btn');
  const userPrompt = document.getElementById('user-prompt');
  const chips = document.querySelectorAll('.chip');

  let activeUserName = "User";
  let latestDraftData = { email: "", subject: "", body: "" };

  // --- Voice Greeting Function ---
  function speakGreeting() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const greetingText = "Welcome to Gmail AI Assistant. Ready for your commands!";
      const utterance = new SpeechSynthesisUtterance(greetingText);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }

  // --- Quick Template Chips ---
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      userPrompt.value = chip.getAttribute('data-query');
      statusText.innerText = "Template loaded!";
      statusText.style.color = "#60a5fa";
    });
  });

  // --- Voice Input (Speech to Text) ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      micBtn.classList.add('mic-active');
      statusText.innerText = "Listening... Speak now!";
      statusText.style.color = "#ef4444";
    };

    recognition.onresult = (event) => {
      userPrompt.value = event.results[0][0].transcript;
      statusText.innerText = "Voice recognized successfully!";
      statusText.style.color = "#22c55e";
    };

    recognition.onerror = () => {
      statusText.innerText = "Voice input error. Try again!";
      statusText.style.color = "#ef4444";
      micBtn.classList.remove('mic-active');
    };

    recognition.onend = () => {
      micBtn.classList.remove('mic-active');
    };

    micBtn.addEventListener('click', () => {
      try { recognition.start(); } catch (err) { recognition.stop(); }
    });
  } else {
    micBtn.style.display = 'none';
  }

  // --- Text-to-Speech (AI Voice Output / Read Aloud) ---
  speakBtn.addEventListener('click', () => {
    if (!latestDraftData.body) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `Subject: ${latestDraftData.subject}. Body: ${latestDraftData.body}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        statusText.innerText = "Reading email aloud...";
        statusText.style.color = "#7c3aed";
      };

      utterance.onend = () => {
        statusText.innerText = "Finished reading.";
        statusText.style.color = "#22c55e";
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  });

  // --- Smart Sign-In Fallback with Voice Greeting ---
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      authCard.classList.add('hidden');
      agentCard.classList.remove('hidden');
      userInfo.innerText = "Connected: Guest / Direct Mode";
      statusText.innerText = "Status: Direct Mode Active";
      statusText.style.color = "#22c55e";
      
      // Trigger voice greeting on entering
      speakGreeting();
    });
  }

  // --- Draft Generation ---
  generateBtn.addEventListener('click', () => {
    const greetingType = document.getElementById('greeting-type').value;
    const emailTone = document.getElementById('email-tone').value;
    const promptText = userPrompt.value.trim();

    if (!promptText) {
      statusText.innerText = "Please enter or select a prompt!";
      statusText.style.color = "#ef4444";
      return;
    }

    statusText.innerText = "Generating AI Draft...";
    statusText.style.color = "#60a5fa";

    chrome.runtime.sendMessage(
      { action: "generate_draft", username: activeUserName, greetingType, emailTone, promptText },
      (response) => {
        if (response && response.success) {
          latestDraftData = response;
          statusText.innerText = `Success! Draft ready for ${response.email}`;
          statusText.style.color = "#22c55e";

          emailPreview.innerText = `To: ${response.email}\nSubject: ${response.subject}\n\n${response.body}`;
          resultCard.classList.remove('hidden');
        } else {
          statusText.innerText = "Error generating draft.";
          statusText.style.color = "#ef4444";
        }
      }
    );
  });

  // --- Open in Gmail Action ---
  openGmailBtn.addEventListener('click', () => {
    if (!latestDraftData.email) return;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(latestDraftData.email)}&su=${encodeURIComponent(latestDraftData.subject)}&body=${encodeURIComponent(latestDraftData.body)}`;
    
    chrome.tabs.create({ url: gmailUrl });
  });
});