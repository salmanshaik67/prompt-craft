document.addEventListener('DOMContentLoaded', () => {
    // Typewriter animation for heading
    const heading = document.querySelector('h1.glitch');
    const fullText = heading.textContent;
    heading.textContent = '';
    heading.classList.add('typing');

    let charIndex = 0;
    const typeSpeed = 100; // milliseconds per character

    function typeWriter() {
        if (charIndex < fullText.length) {
            heading.textContent += fullText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, typeSpeed);
        } else {
            // Animation complete
            heading.classList.remove('typing');
            heading.classList.add('typing-complete');
            // Remove typing-complete class after animation
            setTimeout(() => {
                heading.classList.remove('typing-complete');
            }, 1000);
        }
    }

    // Start typing after a brief delay
    setTimeout(typeWriter, 300);

    const craftBtn = document.getElementById('craftBtn');
    const userPrompt = document.getElementById('userPrompt');

    const refinedContent = document.getElementById('refinedContent');
    const statusRefined = document.getElementById('statusRefined');
    const copyRefinedBtn = document.getElementById('copyRefinedBtn');

    const gptContent = document.getElementById('gptContent');
    const statusGpt = document.getElementById('statusGpt');
    const copyGptBtn = document.getElementById('copyGptBtn');

    let pendingPrompt = null;

    craftBtn.addEventListener('click', async () => {
        const text = userPrompt.value.trim();
        if (!text) return;

        // UI State: Loading
        setLoadingState(true);

        // Prepare payload
        let payloadPrompt = text;
        if (pendingPrompt) {
            payloadPrompt = pendingPrompt + " " + text;
        }

        try {
            const response = await fetch('/craft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: payloadPrompt }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let isClarification = false;
            let hasRefinedStarted = false;
            let hasGptStarted = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // Check for Clarification
                if (!isClarification && accumulatedText.includes("CLARIFICATION_REQUIRED:")) {
                    isClarification = true;
                    setLoadingState(false); // Stop thinking
                    handleClarificationMode();
                }

                if (isClarification) {
                    // Update clarification question
                    const question = accumulatedText.split("CLARIFICATION_REQUIRED:")[1] || "";
                    gptContent.textContent = question.trim();
                    continue;
                }

                // Handle Success Flow
                // Check for Refined Prompt start
                if (!hasRefinedStarted && accumulatedText.includes("REFINED_PROMPT:")) {
                    hasRefinedStarted = true;
                    // Clear thinking animation from refined box only
                    refinedContent.innerHTML = "";
                    statusRefined.textContent = "GENERATING...";
                    statusRefined.classList.add('pulse-animation');
                }

                // Check for GPT Response start
                if (!hasGptStarted && accumulatedText.includes("GPT_RESPONSE:")) {
                    hasGptStarted = true;
                    // Clear thinking animation from GPT box
                    gptContent.innerHTML = "";
                    statusGpt.textContent = "GENERATING...";
                    statusGpt.classList.add('pulse-animation');

                    // Mark refined as complete
                    statusRefined.textContent = "COMPLETE";
                    statusRefined.classList.remove('pulse-animation');
                    statusRefined.style.color = "#00f3ff";
                    statusRefined.style.borderColor = "#00f3ff";
                }

                // Update Content
                if (hasRefinedStarted && !hasGptStarted) {
                    // We are in Refined Prompt section
                    // Extract text between REFINED_PROMPT: and |||SEPARATOR|||
                    let content = accumulatedText.split("REFINED_PROMPT:")[1] || "";
                    if (content.includes("|||SEPARATOR|||")) {
                        content = content.split("|||SEPARATOR|||")[0];
                    }
                    refinedContent.textContent = content.trim();
                } else if (hasGptStarted) {
                    // We are in GPT Response section
                    let content = accumulatedText.split("GPT_RESPONSE:")[1] || "";
                    gptContent.textContent = content; // Stream raw text first
                }
            }

            // Finalize
            if (isClarification) {
                pendingPrompt = payloadPrompt; // Store for next turn
                // Ensure UI is set for clarification reply
                statusRefined.textContent = "PENDING";
                statusRefined.style.color = "#ff9e00";
                statusRefined.style.borderColor = "#ff9e00";
                refinedContent.textContent = payloadPrompt; // Show original prompt

                statusGpt.textContent = "CLARIFICATION NEEDED";
                statusGpt.style.color = "#ff9e00";
                statusGpt.style.borderColor = "#ff9e00";
            } else {
                // Success Finalization
                pendingPrompt = null;
                userPrompt.value = "";
                userPrompt.placeholder = "Enter your raw idea here...";
                craftBtn.querySelector('.btn-text').textContent = "INITIALIZE CRAFTING";

                // Only mark GPT as complete if it has started
                if (hasGptStarted) {
                    statusGpt.textContent = "COMPLETE";
                    statusGpt.classList.remove('pulse-animation');
                    statusGpt.style.color = "#00f3ff";
                    statusGpt.style.borderColor = "#00f3ff";
                }

                // Render Markdown
                gptContent.innerHTML = marked.parse(gptContent.textContent);
            }

        } catch (error) {
            console.error('Error:', error);
            refinedContent.textContent = "Error processing request.";
            gptContent.textContent = "Check console for details.";
            statusRefined.textContent = "ERROR";
            statusGpt.textContent = "ERROR";
            statusRefined.style.color = "red";
            statusRefined.style.borderColor = "red";
        } finally {
            // Ensure loading state is cleared if not already
            if (!pendingPrompt) {
                craftBtn.disabled = false;
                craftBtn.style.opacity = "1";
            }
        }
    });

    function setLoadingState(isLoading) {
        craftBtn.disabled = isLoading;
        craftBtn.style.opacity = isLoading ? "0.5" : "1";

        if (isLoading) {
            // Inject Thinking Animation
            const thinkingHTML = `
                <div class="thinking-container">
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                </div>
            `;
            refinedContent.innerHTML = thinkingHTML;
            gptContent.innerHTML = thinkingHTML;

            statusRefined.textContent = "THINKING...";
            statusRefined.style.color = "#bc13fe";
            statusRefined.style.borderColor = "#bc13fe";

            statusGpt.textContent = "WAITING...";
            statusGpt.style.color = "#bc13fe";
            statusGpt.style.borderColor = "#bc13fe";
        }
    }

    function handleClarificationMode() {
        userPrompt.value = "";
        userPrompt.placeholder = "Type your answer here...";
        craftBtn.querySelector('.btn-text').textContent = "SUBMIT ANSWER";
        craftBtn.disabled = false;
        craftBtn.style.opacity = "1";
    }

    // Copy Functionality
    setupCopy(copyRefinedBtn, refinedContent);
    setupCopy(copyGptBtn, gptContent);

    function setupCopy(btn, contentElement) {
        btn.addEventListener('click', () => {
            const textToCopy = contentElement.textContent;
            if (textToCopy && !textToCopy.includes("thinking-dot")) {
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
