
document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).style.display = 'block';
    });
  });
  
  const select = document.getElementById('openPreference');
  select.addEventListener('change', () => {
    browser.storage.local.set({ openPreference: select.value });
  });
  
  browser.storage.local.get('openPreference').then(data => {
    if (data.openPreference) {
      select.value = data.openPreference;
    }
  });