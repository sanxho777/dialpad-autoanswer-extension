(function() {
  'use strict';

  const POLL_INTERVAL = 5;
  let pollIntervalId = null;
  let observer = null;
  let isEnabled = false;

  console.log('[AUTO-ANSWER] Extension loaded');

  // Check for Accept buttons and click them
  function tryAnswerCall() {
    if (!isEnabled) return false;

    const acceptButtons = [
      ...Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent.includes('Accept') &&
        btn.getAttribute('aria-label') !== 'Accept'
      ),
      ...Array.from(document.querySelectorAll('[role="button"]')).filter(btn =>
        btn.textContent.includes('Accept')
      )
    ];

    for (const button of acceptButtons) {
      const rect = button.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        console.log('[AUTO-ANSWER] ✅ INCOMING CALL DETECTED! Answering now...');
        button.click();
        return true;
      }
    }
    return false;
  }

  // Start the auto-answer system
  function startAutoAnswer() {
    if (isEnabled) return; // Already running

    isEnabled = true;
    console.log('[AUTO-ANSWER] Starting auto-answer monitoring...');

    // Start polling
    pollIntervalId = setInterval(() => {
      tryAnswerCall();
    }, POLL_INTERVAL);

    // Start DOM observer
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent || '';
              if (text.includes('Incoming call') || text.includes('Accept')) {
                console.log('[AUTO-ANSWER] 🔔 DOM change detected - checking for call...');
                setTimeout(tryAnswerCall, 10);
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    console.log('[AUTO-ANSWER] 🤖 Auto-answer system ACTIVE!');
    console.log('[AUTO-ANSWER] Monitoring every ' + POLL_INTERVAL + 'ms + DOM changes');
  }

  // Stop the auto-answer system
  function stopAutoAnswer() {
    if (!isEnabled) return; // Already stopped

    isEnabled = false;

    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    console.log('[AUTO-ANSWER] ⛔ Auto-answer system STOPPED');
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleAutoAnswer') {
      if (message.enabled) {
        startAutoAnswer();
      } else {
        stopAutoAnswer();
      }
      sendResponse({ success: true });
    }
    return true;
  });

  // Check storage on load to see if it should be enabled
  chrome.storage.local.get(['autoAnswerEnabled'], (result) => {
    if (result.autoAnswerEnabled) {
      startAutoAnswer();
    }
  });

})();
