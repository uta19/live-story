const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

function resizePhoneFrames() {
  const wrappers = document.querySelectorAll('.phone-wrapper');
  const viewportWidth = window.innerWidth;

  wrappers.forEach((wrapper) => {
    const scaler = wrapper.querySelector('.phone-scaler');
    if (!scaler) return;

    let scale = 1;
    const padding = 48;
    if (viewportWidth < PHONE_WIDTH + padding) {
      scale = (viewportWidth - padding) / PHONE_WIDTH;
      scale = Math.max(scale, 0.4);
    }

    scaler.style.setProperty('--phone-scale', scale);
    wrapper.style.height = `${PHONE_HEIGHT * scale}px`;
    scaler.style.height = `${PHONE_HEIGHT}px`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  resizePhoneFrames();
  window.addEventListener('resize', resizePhoneFrames);
});

