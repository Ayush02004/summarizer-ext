document.getElementById('save').addEventListener('click', () => {
  const setting1 = document.getElementById('setting1').value;
  const setting2 = document.getElementById('setting2').value;

  chrome.storage.sync.set({ setting1, setting2 }, () => {
    alert('Settings saved');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['setting1', 'setting2'], (result) => {
    document.getElementById('setting1').value = result.setting1 || '';
    document.getElementById('setting2').value = result.setting2 || '';
  });
});