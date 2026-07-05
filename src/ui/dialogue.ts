let hideTimer: number | undefined;

export function showLine(text: string, durationMs = 2800): void {
  const el = document.getElementById('dialogue');
  if (el === null) {
    console.warn('Strange Worlds: #dialogue overlay missing, line dropped:', text);
    return;
  }
  el.textContent = text;
  el.classList.add('visible');
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => el.classList.remove('visible'), durationMs);
}
