(() => {
  if (window.__webSnakeDemoOverlay) {
    return;
  }

  window.__webSnakeDemoOverlay = true;

  const install = () => {
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';

    const caption = document.createElement('div');
    caption.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;padding:12px 30px;background:rgba(9,8,13,.9);' +
      'border-top:3px solid #ff3b9d;color:#fff;font:600 19px/1.4 system-ui,sans-serif;text-align:center;' +
      'opacity:0;transition:opacity .2s';

    const pointer = document.createElement('div');
    pointer.style.cssText =
      'position:fixed;width:18px;height:18px;margin:-9px;border:2px solid #fff;border-radius:50%;' +
      'background:rgba(255,59,157,.65);box-shadow:0 0 0 1px #0b0910;transform:translate(-50px,-50px)';

    layer.append(caption, pointer);
    document.documentElement.appendChild(layer);

    let position = { x: -50, y: -50 };
    const movePointer = (x, y, scale = 1) => {
      position = { x, y };
      pointer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };

    window.dghsfCaption = (text) => {
      caption.textContent = text || '';
      caption.style.opacity = text ? '1' : '0';
    };

    document.addEventListener('mousemove', (event) => {
      movePointer(event.clientX, event.clientY);
    }, true);

    document.addEventListener('mousedown', (event) => {
      movePointer(event.clientX, event.clientY, 0.72);
      const ripple = document.createElement('div');
      ripple.style.cssText =
        `position:fixed;left:${position.x - 20}px;top:${position.y - 20}px;width:40px;height:40px;` +
        'border:3px solid #ff3b9d;border-radius:50%;transition:transform .45s,opacity .45s';
      layer.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1.8)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => ripple.remove(), 500);
    }, true);

    document.addEventListener('mouseup', () => {
      movePointer(position.x, position.y);
    }, true);
  };

  if (document.documentElement) {
    install();
  } else {
    document.addEventListener('DOMContentLoaded', install);
  }
})();
