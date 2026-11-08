// Official Support Directory Map
const OFFICIAL_DIRECTORY = {
    "jazzcash": "support@jazzcash.com.pk",
    "jazz cash": "support@jazzcash.com.pk",
    "easypaisa": "support@easypaisa.com.pk",
    "whatsapp": "support@whatsapp.com",
    "w.app": "support@whatsapp.com",
    "facebook": "support@fb.com",
    "instagram": "support@instagram.com",
    "google": "support@google.com",
    "nadra": "support@nadra.gov.pk"
};

// Smart Filtration Engine for Roman Urdu / English noise words
function cleanCompanyName(text) {
    let clean = text.toLowerCase().trim();
    const noiseWords = [
        "ko bhejni h", "ko mail bhejni h", "ko email bhejni h", 
        "ko bhejni hai", "ko mail karni h", "pe mail bhejni h",
        "ko", "par", "pe", "say", "se", "email", "mail", "karni hai", "h"
    ];

    noiseWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        clean = clean.replace(regex, "").trim();
    });

    return clean.split(" ")[0] || clean;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_draft") {
        const { username, greetingType, emailTone, promptText } = request;

        // Custom Culture Greetings
        let greeting = "";
        if (greetingType === "islamic") {
            greeting = `السلام علیکم (Assalamu Alaikum) ${username},`;
        } else if (greetingType === "english") {
            greeting = `Dear ${username},`;
        } else {
            greeting = `آداب (Adab) ${username},`;
        }

        const companyKey = cleanCompanyName(promptText);
        const toEmail = OFFICIAL_DIRECTORY[companyKey] || `support@${companyKey ? companyKey : "company"}.com`;
        const companyDisplayName = companyKey ? (companyKey.charAt(0).toUpperCase() + companyKey.slice(1)) : "Support Team";

        // Dynamic Subject & Tone Engine
        let subject = `Support Request regarding ${companyDisplayName} Services`;
        let introLine = `I am reaching out to formally report an issue regarding my account services.`;

        if (emailTone === "strict") {
            subject = `URGENT: Immediate Action Required - ${companyDisplayName}`;
            introLine = `I am writing to express my serious concern regarding an unresolved critical issue with my account. Immediate resolution is expected.`;
        } else if (emailTone === "friendly") {
            subject = `Friendly Inquiry regarding ${companyDisplayName} account`;
            introLine = `Hope you are doing well. I needed a little help regarding my account query.`;
        }

        if (companyKey.includes("jazzcash") || companyKey.includes("easypaisa")) {
            subject = `Urgent Dispute & Account Assistance - ${companyDisplayName}`;
        }

        const fullEmailBody = `Respected ${companyDisplayName} Support Team,\n\n${greeting}\n\n${introLine}\n\nSummary of Issue:\n${promptText}\n\nKindly investigate this matter and advise on the necessary resolution steps at your earliest convenience.\n\nBest regards,\n${username}`;

        sendResponse({
            success: true,
            email: toEmail,
            subject: subject,
            body: fullEmailBody
        });
    }
    return true;
});