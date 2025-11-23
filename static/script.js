document.addEventListener('DOMContentLoaded', () => {
    const craftBtn = document.getElementById('craftBtn');
    const userPrompt = document.getElementById('userPrompt');

    const refinedContent = document.getElementById('refinedContent');
    const statusRefined = document.getElementById('statusRefined');
    const copyRefinedBtn = document.getElementById('copyRefinedBtn');

    const gptContent = document.getElementById('gptContent');
    const statusGpt = document.getElementById('statusGpt');
    const copyGptBtn = document.getElementById('copyGptBtn');

    let pendingPrompt = null; // Store original prompt if clarification is needed

    craftBtn.addEventListener('click', async () => {
        const text = userPrompt.value.trim();
        if (!text) return;

        // UI State: Loading
        setLoadingState(true);
        refinedContent.textContent = "";
        gptContent.textContent = "";

        // Prepare payload: if we are replying to a clarification, combine prompts
        let payloadPrompt = text;
        if (pendingPrompt) {
            payloadPrompt = pendingPrompt + " " + text;
        }

        try {
            const response = await fetch('/craft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: payloadPrompt }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'clarification') {
                // Handle Clarification Request
                pendingPrompt = text; // Store original prompt

                // Show the original prompt in REFINED PROMPT area
                statusRefined.textContent = "PENDING";
                statusRefined.style.color = "#ff9e00";
                statusRefined.style.borderColor = "#ff9e00";
                refinedContent.textContent = text;

                // Show question in GPT RESPONSE area
                statusGpt.textContent = "CLARIFICATION NEEDED";
                statusGpt.style.color = "#ff9e00";
                statusGpt.style.borderColor = "#ff9e00";
                gptContent.textContent = data.question;

                // Update UI to ask for reply
                userPrompt.value = "";
                userPrompt.placeholder = "Type your answer here...";
                craftBtn.querySelector('.btn-text').textContent = "SUBMIT ANSWER";

            } else {
                // Handle Success
                pendingPrompt = null; // Reset
                userPrompt.value = "";
                userPrompt.placeholder = "Enter your raw idea here...";
                craftBtn.querySelector('.btn-text').textContent = "INITIALIZE CRAFTING";

                // Update UI with results
                // For Refined Prompt
                typeWriter(data.refined_prompt, refinedContent, () => {
                    statusRefined.textContent = "COMPLETE";
                    statusRefined.style.color = "#00f3ff";
                    statusRefined.style.borderColor = "#00f3ff";
                });

                // For GPT Response
                typeWriter(data.gpt_response, gptContent, () => {
                    statusGpt.textContent = "COMPLETE";
                    statusGpt.style.color = "#00f3ff";
                    statusGpt.style.borderColor = "#00f3ff";

                    // Render Markdown after typing is done
                    gptContent.innerHTML = marked.parse(data.gpt_response);
                });
            }

        } catch (error) {
            console.error('Error:', error);
            refinedContent.textContent = "Error processing request.";
            gptContent.textContent = "Check console for details.";
            statusRefined.textContent = "ERROR";
            statusGpt.textContent = "ERROR";
            statusRefined.style.color = "red";
            statusRefined.style.borderColor = "red";
            statusGpt.style.color = "red";
            statusGpt.style.borderColor = "red";
            pendingPrompt = null; // Reset on error
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(isLoading) {
        craftBtn.disabled = isLoading;
        craftBtn.style.opacity = isLoading ? "0.5" : "1";

        if (isLoading) {
            statusRefined.textContent = "PROCESSING...";
            statusRefined.style.color = "#bc13fe";
            statusRefined.style.borderColor = "#bc13fe";

            statusGpt.textContent = "WAITING...";
            statusGpt.style.color = "#bc13fe";
            statusGpt.style.borderColor = "#bc13fe";
        }
    }

    // Typewriter Effect
    function typeWriter(text, element, callback, i = 0) {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            // Faster typing: 1ms for long text, 10ms for short
            const speed = text.length > 200 ? 1 : 10;
            setTimeout(() => typeWriter(text, element, callback, i + 1), speed);
        } else if (callback) {
            callback();
        }
    }

    // Copy Functionality
    setupCopy(copyRefinedBtn, refinedContent);
    setupCopy(copyGptBtn, gptContent);

    function setupCopy(btn, contentElement) {
        btn.addEventListener('click', () => {
            const textToCopy = contentElement.textContent;
            if (textToCopy && textToCopy !== "Waiting for input stream..." && textToCopy !== "Error processing request.") {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalIcon = btn.innerHTML;
                    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        btn.innerHTML = originalIcon;
                    }, 2000);
                });
            }
        });
    }
});
