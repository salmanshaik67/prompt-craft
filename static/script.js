document.addEventListener('DOMContentLoaded', () => {
    const craftBtn = document.getElementById('craftBtn');
    const userPrompt = document.getElementById('userPrompt');
    const outputContent = document.getElementById('outputContent');
    const statusIndicator = document.querySelector('.status-indicator');
    const copyBtn = document.getElementById('copyBtn');

    craftBtn.addEventListener('click', async () => {
        const text = userPrompt.value.trim();
        if (!text) return;

        // UI State: Loading
        statusIndicator.textContent = "PROCESSING...";
        statusIndicator.style.color = "#bc13fe";
        statusIndicator.style.borderColor = "#bc13fe";
        outputContent.textContent = "";
        craftBtn.disabled = true;
        craftBtn.style.opacity = "0.5";

        try {
            const response = await fetch('/craft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: text })
            });

            const data = await response.json();
            
            // Simulate processing delay for effect
            setTimeout(() => {
                typeWriter(data.crafted_prompt);
                statusIndicator.textContent = "COMPLETE";
                statusIndicator.style.color = "#00f3ff";
                statusIndicator.style.borderColor = "#00f3ff";
                craftBtn.disabled = false;
                craftBtn.style.opacity = "1";
            }, 800);

        } catch (error) {
            console.error('Error:', error);
            outputContent.textContent = "SYSTEM ERROR: Connection Lost.";
            statusIndicator.textContent = "ERROR";
            statusIndicator.style.color = "red";
            statusIndicator.style.borderColor = "red";
            craftBtn.disabled = false;
            craftBtn.style.opacity = "1";
        }
    });

    // Typewriter Effect
    function typeWriter(text, i = 0) {
        if (i < text.length) {
            outputContent.textContent += text.charAt(i);
            setTimeout(() => typeWriter(text, i + 1), 20); // Speed of typing
        }
    }

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        const textToCopy = outputContent.textContent;
        if (textToCopy && textToCopy !== "Waiting for input stream...") {
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalIcon = copyBtn.innerHTML;
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                }, 2000);
            });
        }
    });
});
