(function addDemoOverlay() {
  function ready(callback) {
    if (document.body) callback();
    else requestAnimationFrame(() => ready(callback));
  }

  ready(() => {
    const pointer = document.createElement("div");
    pointer.style.cssText = [
      "position:fixed",
      "z-index:2147483647",
      "width:18px",
      "height:18px",
      "margin:-9px 0 0 -9px",
      "border:2px solid #101812",
      "border-radius:50%",
      "background:#f28ab2",
      "box-shadow:0 0 0 3px rgba(242,138,178,.25)",
      "pointer-events:none",
      "transition:transform .08s,background .08s"
    ].join(";");

    const caption = document.createElement("div");
    caption.style.cssText = [
      "position:fixed",
      "z-index:2147483646",
      "right:0",
      "bottom:0",
      "left:0",
      "padding:14px 22px",
      "background:rgba(10,17,12,.92)",
      "border-top:1px solid rgba(242,138,178,.5)",
      "color:#f0f3eb",
      "font:600 16px/1.3 sans-serif",
      "letter-spacing:.01em",
      "text-align:center",
      "pointer-events:none"
    ].join(";");
    caption.hidden = true;

    document.body.append(pointer, caption);
    window.dghsfCaption = (text) => {
      caption.textContent = text;
      caption.hidden = !text;
    };

    document.addEventListener("pointermove", (event) => {
      pointer.style.left = `${event.clientX}px`;
      pointer.style.top = `${event.clientY}px`;
    });
    document.addEventListener("pointerdown", () => {
      pointer.style.background = "#ffffff";
      pointer.style.transform = "scale(.72)";
    });
    document.addEventListener("pointerup", () => {
      pointer.style.background = "#f28ab2";
      pointer.style.transform = "scale(1)";
    });
  });
})();
