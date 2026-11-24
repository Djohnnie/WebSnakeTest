(() => {
    const state = { x: 0, y: 0, clickAt: 0, caption: "" };

    const install = () => {
        const pointer = document.createElement("div");
        pointer.style.cssText = [
            "position:fixed",
            "z-index:2147483647",
            "width:18px",
            "height:18px",
            "border:2px solid #fff",
            "border-radius:50%",
            "background:rgba(255,59,157,.72)",
            "box-shadow:0 0 0 5px rgba(255,59,157,.22)",
            "pointer-events:none",
            "transform:translate(-50%,-50%)",
            "transition:width .08s,height .08s"
        ].join(";");

        const caption = document.createElement("div");
        caption.style.cssText = [
            "position:fixed",
            "z-index:2147483647",
            "left:0",
            "right:0",
            "bottom:0",
            "padding:15px 28px",
            "color:#fff",
            "background:linear-gradient(90deg,rgba(8,8,13,.96),rgba(38,12,29,.96))",
            "border-top:2px solid #ff3b9d",
            "font:600 18px/1.3 Inter,system-ui,sans-serif",
            "text-align:center",
            "pointer-events:none"
        ].join(";");
        caption.hidden = true;

        document.documentElement.append(pointer, caption);

        window.dghsfCaption = text => {
            state.caption = text;
            caption.textContent = text;
            caption.hidden = !text;
        };

        document.addEventListener("mousemove", event => {
            state.x = event.clientX;
            state.y = event.clientY;
            pointer.style.left = `${state.x}px`;
            pointer.style.top = `${state.y}px`;
        });

        document.addEventListener("mousedown", () => {
            state.clickAt = performance.now();
            pointer.style.width = "12px";
            pointer.style.height = "12px";
        });

        document.addEventListener("mouseup", () => {
            pointer.style.width = "18px";
            pointer.style.height = "18px";
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
