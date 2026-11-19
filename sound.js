const bubbleSounds = [
  new Audio("sounds/wipe-pack.wav"),
  new Audio("sounds/blister-pack.wav"),
];

const soundVolume = 0.62;
let soundUnlocked = false;
let lastSoundTime = 0;
let lastPointer = { x: 0, y: 0 };

bubbleSounds.forEach((sound) => {
  sound.preload = "auto";
  sound.volume = soundVolume;
});

function unlockBubbleSounds() {
  soundUnlocked = true;
  bubbleSounds.forEach((sound) => {
    sound.load();
  });
}

function playBubbleSound() {
  if (!soundUnlocked) return;
  const sound = bubbleSounds[Math.floor(Math.random() * bubbleSounds.length)].cloneNode();
  sound.volume = soundVolume;
  sound.play().catch(() => {});
}

document.addEventListener("pointerdown", unlockBubbleSounds, { once: true });
document.addEventListener("pointermove", (event) => {
  const distance = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
  const now = performance.now();
  lastPointer = { x: event.clientX, y: event.clientY };

  if (distance < 22 || now - lastSoundTime < 140) return;
  lastSoundTime = now;
  playBubbleSound();
});
