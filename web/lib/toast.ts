export function showToast(message: string) {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = message;
  el.style.position = "fixed";
  el.style.bottom = "24px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.background = "rgba(0,0,0,0.8)";
  el.style.color = "#fff";
  el.style.padding = "8px 12px";
  el.style.borderRadius = "8px";
  el.style.fontSize = "12px";
  el.style.zIndex = "9999";
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 250ms";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 1800);
}

