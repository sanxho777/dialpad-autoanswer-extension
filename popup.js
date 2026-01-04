const toggle = document.getElementById('toggle');
const status = document.getElementById('status');
const statusText = document.getElementById('status-text');

// Load saved state
chrome.storage.local.get(['autoAnswerEnabled'], (result) => {
  const enabled = result.autoAnswerEnabled || false;
  toggle.checked = enabled;
  updateStatusDisplay(enabled);
});

// Handle toggle changes
toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  
  // Save state
  chrome.storage.local.set({ autoAnswerEnabled: enabled });
  
  // Update display
  updateStatusDisplay(enabled);
  
  // Send message to content script in active tab
  try {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:')) {
  await chrome.tabs.sendMessage(tab.id, {
  action: 'toggleAutoAnswer',
  enabled: enabled
  }).catch(() => {
  // Silently ignore if content script not ready yet
  });
  }
  } catch (e) {
  // Ignore errors for tabs where content scripts can't run
  }
});

function updateStatusDisplay(enabled) {
  if (enabled) {
  status.className = 'status active';
  statusText.textContent = 'Active - Monitoring for calls';
  status.innerHTML = '<span class="status-icon">✅</span><span>Active - Monitoring</span>';
  } else {
  status.className = 'status inactive';
  status.innerHTML = '<span class="status-icon">⛔</span><span>Disabled</span>';
  }
}