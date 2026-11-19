const canvas = document.querySelector('#pixelCanvas');
const context = canvas.getContext('2d');
const titleCharacters = document.querySelectorAll('#title span');
const title = document.querySelector('#title');
const clickSounds = [
  new Audio('assets/sounds/pixel.wav'),
  new Audio('assets/sounds/pixel-2.wav'),
];

const pixelSize = 12;
const gap = 0;
const maxSprites = 5;
const imageSources = Array.from({ length: 12 }, (_, index) => `assets/qa/${index + 1}.png`);
const images = imageSources.map((source) => {
  const image = new Image();
  image.src = source;
  return image;
});

const ripples = [];
const ambientSquares = [];
let connections = [];
let columns = 0;
let rows = 0;
let sprites = [];
let nextAmbientSpawn = 0;
let nextConnectionUpdate = 0;
let pointerState = null;
let nextSoundIndex = 0;

const blinkCharacter = (character) => {
  character.classList.toggle('is-light');
  const nextBlink = 1800 + Math.random() * 2600;
  window.setTimeout(() => blinkCharacter(character), nextBlink);
};

const playClickSound = () => {
  const sound = clickSounds[nextSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
  nextSoundIndex = (nextSoundIndex + 1) % clickSounds.length;
};

titleCharacters.forEach((character, index) => {
  if (index % 3 === 1) character.classList.add('is-light');
  window.setTimeout(() => blinkCharacter(character), 1200 + Math.random() * 2400);
});

const resizeCanvas = () => {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  columns = Math.ceil(window.innerWidth / pixelSize);
  rows = Math.ceil(window.innerHeight / pixelSize);
  placeAllSprites();
};

const randomImage = (currentImage) => {
  const usage = new Map();
  sprites.forEach((sprite) => {
    usage.set(sprite.image, (usage.get(sprite.image) || 0) + 1);
  });

  const choices = images.filter((image) => image !== currentImage && !usage.has(image));
  return choices[Math.floor(Math.random() * choices.length)];
};

const spriteScale = (image) => {
  const maxDimension = Math.min(300, Math.min(window.innerWidth, window.innerHeight) * 0.32);
  return maxDimension / Math.max(image.naturalWidth, image.naturalHeight);
};

const overlaps = (candidate, other, padding = 18) => candidate.x < other.x + other.width + padding
  && candidate.x + candidate.width + padding > other.x
  && candidate.y < other.y + other.height + padding
  && candidate.y + candidate.height + padding > other.y;

const overlapsTitle = (candidate, padding = 18) => {
  const titleRect = title.getBoundingClientRect();
  return candidate.x < titleRect.right + padding
    && candidate.x + candidate.width + padding > titleRect.left
    && candidate.y < titleRect.bottom + padding
    && candidate.y + candidate.height + padding > titleRect.top;
};

const placeSprite = (sprite, occupied = []) => {
  sprite.scale = spriteScale(sprite.image);
  sprite.width = sprite.image.naturalWidth * sprite.scale;
  sprite.height = sprite.image.naturalHeight * sprite.scale;

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const candidate = {
      x: Math.random() * Math.max(0, window.innerWidth - sprite.width),
      y: Math.random() * Math.max(0, window.innerHeight - sprite.height),
      width: sprite.width,
      height: sprite.height,
    };
    if (occupied.every((other) => !overlaps(candidate, other)) && !overlapsTitle(candidate)) {
      sprite.x = candidate.x;
      sprite.y = candidate.y;
      return;
    }
  }

  for (let y = 0; y <= window.innerHeight - sprite.height; y += 24) {
    for (let x = 0; x <= window.innerWidth - sprite.width; x += 24) {
      const candidate = { x, y, width: sprite.width, height: sprite.height };
      if (occupied.every((other) => !overlaps(candidate, other)) && !overlapsTitle(candidate)) {
        sprite.x = x;
        sprite.y = y;
        return;
      }
    }
  }

  sprite.x = 0;
  sprite.y = 0;
};

const placeAllSprites = () => {
  sprites.forEach((sprite, index) => {
    placeSprite(sprite, sprites.slice(0, index));
  });
};

const replaceSprite = (index) => {
  const sprite = sprites[index];
  sprite.image = randomImage(sprite.image);
  placeSprite(sprite, sprites.filter((_, spriteIndex) => spriteIndex !== index));
};

const initSprites = () => {
  sprites = Array.from({ length: maxSprites }, (_, index) => ({
    image: images[index],
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }));
  placeAllSprites();
};

const drawSprites = () => {
  sprites.forEach((sprite, index) => {
    const isHeld = pointerState?.index === index;

    if (!isHeld) {
      context.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
      return;
    }

    const shakeX = (Math.random() - 0.5) * 5;
    const shakeY = (Math.random() - 0.5) * 5;
    const shakeAngle = (Math.random() - 0.5) * 0.045;
    context.save();
    context.translate(sprite.x + sprite.width / 2 + shakeX, sprite.y + sprite.height / 2 + shakeY);
    context.rotate(shakeAngle);
    context.drawImage(sprite.image, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
    context.restore();
  });
};

const drawRipples = () => {
  ripples.forEach((ripple) => {
    const rippleWidth = pixelSize * 0.08;
    const start = Math.max(0, ripple.radius - rippleWidth);
    const end = ripple.radius + rippleWidth;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const centerX = column * pixelSize + pixelSize / 2;
        const centerY = row * pixelSize + pixelSize / 2;
        const distance = Math.hypot(centerX - ripple.x, centerY - ripple.y);

        if (distance >= start && distance <= end) {
          context.fillStyle = '#111';
          context.fillRect(column * pixelSize, row * pixelSize, pixelSize - gap, pixelSize - gap);
        }
      }
    }
  });
};

const updateRipples = () => {
  for (let index = ripples.length - 1; index >= 0; index -= 1) {
    const ripple = ripples[index];
    ripple.radius += 9;

    sprites.forEach((sprite, spriteIndex) => {
      if (ripple.affected.has(spriteIndex)) return;

      const centerX = sprite.x + sprite.width / 2;
      const centerY = sprite.y + sprite.height / 2;
      const distance = Math.hypot(centerX - ripple.x, centerY - ripple.y);
      const distanceToEdge = Math.hypot(
        Math.max(sprite.x - ripple.x, 0, ripple.x - (sprite.x + sprite.width)),
        Math.max(sprite.y - ripple.y, 0, ripple.y - (sprite.y + sprite.height)),
      );

      if (ripple.radius >= distanceToEdge && ripple.radius <= distance + Math.max(sprite.width, sprite.height)) {
        replaceSprite(spriteIndex);
        ripple.affected.add(spriteIndex);
      }
    });

    if (ripple.radius > ripple.maxRadius) ripples.splice(index, 1);
  }
};

const updateAmbientSquares = (time) => {
  if (time >= nextAmbientSpawn) {
    const amount = 1 + Math.floor(Math.random() * 3);
    for (let index = 0; index < amount; index += 1) {
      const size = pixelSize * (1 + Math.floor(Math.random() * 2));
      ambientSquares.push({
        x: Math.floor(Math.random() * Math.max(1, window.innerWidth - size)),
        y: Math.floor(Math.random() * Math.max(1, window.innerHeight - size)),
        size,
        outline: Math.random() < 0.28,
        life: 0,
        maxLife: 35 + Math.floor(Math.random() * 35),
      });
    }
    nextAmbientSpawn = time + 90 + Math.random() * 220;
  }

  for (let index = ambientSquares.length - 1; index >= 0; index -= 1) {
    const square = ambientSquares[index];
    square.life += 1;
    if (square.life >= square.maxLife) ambientSquares.splice(index, 1);
  }
};

const drawAmbientSquares = () => {
  ambientSquares.forEach((square) => {
    const fadeIn = Math.min(1, square.life / 8);
    const fadeOut = Math.min(1, (square.maxLife - square.life) / 10);
    context.globalAlpha = Math.min(fadeIn, fadeOut);
    context.strokeStyle = '#111';
    context.fillStyle = '#111';
    context.lineWidth = 2;
    if (square.outline) {
      context.strokeRect(square.x, square.y, square.size, square.size);
    } else {
      context.fillRect(square.x, square.y, square.size, square.size);
    }
  });
  context.globalAlpha = 1;
};

const updateConnections = (time) => {
  if (time < nextConnectionUpdate || sprites.length < 2) return;

  const pairs = [];
  const amount = 1 + Math.floor(Math.random() * 3);
  while (pairs.length < Math.min(amount, 3)) {
    const first = Math.floor(Math.random() * sprites.length);
    let second = Math.floor(Math.random() * sprites.length);
    while (second === first) second = Math.floor(Math.random() * sprites.length);

    const alreadyExists = pairs.some(([a, b]) => (a === first && b === second) || (a === second && b === first));
    if (!alreadyExists) pairs.push([first, second]);
  }

  connections = pairs.map(([first, second]) => ({ first, second, progress: 0 }));
  nextConnectionUpdate = time + 3200 + Math.random() * 2600;
};

const drawConnections = () => {
  context.save();
  context.strokeStyle = '#111';
  context.lineWidth = 2;
  context.fillStyle = '#111';
  context.beginPath();

  connections.forEach((connection) => {
    connection.progress = Math.min(1, connection.progress + 0.01);
    const first = sprites[connection.first];
    const second = sprites[connection.second];
    if (!first || !second) return;

    const startX = first.x + first.width / 2;
    const startY = first.y + first.height / 2;
    const endX = second.x + second.width / 2;
    const endY = second.y + second.height / 2;
    const currentX = startX + (endX - startX) * connection.progress;
    const currentY = startY + (endY - startY) * connection.progress;

    context.moveTo(startX, startY);
    context.lineTo(currentX, currentY);
    context.fillRect(startX - 4, startY - 4, 8, 8);
    context.fillRect(currentX - 4, currentY - 4, 8, 8);
  });

  context.stroke();
  context.restore();
};

const addRipple = (event, clickedIndex) => {
  const bounds = canvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  ripples.push({
    x,
    y,
    radius: 0,
    affected: new Set(clickedIndex >= 0 ? [clickedIndex] : []),
    maxRadius: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + pixelSize * 2,
  });
};

const hitSprite = (x, y) => {
  for (let index = sprites.length - 1; index >= 0; index -= 1) {
    const sprite = sprites[index];
    if (x >= sprite.x && x <= sprite.x + sprite.width && y >= sprite.y && y <= sprite.y + sprite.height) {
      return index;
    }
  }
  return -1;
};

const canMoveSpriteTo = (index, x, y) => {
  const sprite = sprites[index];
  const candidate = { x, y, width: sprite.width, height: sprite.height };
  return !overlapsTitle(candidate)
    && sprites.every((other, otherIndex) => otherIndex === index || !overlaps(candidate, other));
};

const getPointerPosition = (event) => {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
};

const handleTap = (x, y) => {
  playClickSound();

  const index = hitSprite(x, y);
  if (index >= 0) replaceSprite(index);
  addRipple({ clientX: x, clientY: y }, index);
};

const draw = (time) => {
  context.fillStyle = '#fff';
  context.fillRect(0, 0, window.innerWidth, window.innerHeight);
  updateConnections(time);
  drawConnections();
  drawSprites();
  updateAmbientSquares(time);
  drawAmbientSquares();
  drawRipples();
  updateRipples();
  window.requestAnimationFrame(draw);
};

window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('pointerdown', (event) => {
  const { x, y } = getPointerPosition(event);
  const index = hitSprite(x, y);
  pointerState = {
    index,
    startX: x,
    startY: y,
    offsetX: index >= 0 ? x - sprites[index].x : 0,
    offsetY: index >= 0 ? y - sprites[index].y : 0,
    lastValidX: index >= 0 ? sprites[index].x : 0,
    lastValidY: index >= 0 ? sprites[index].y : 0,
    moved: false,
  };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!pointerState || pointerState.index < 0) return;
  const { x, y } = getPointerPosition(event);
  const distance = Math.hypot(x - pointerState.startX, y - pointerState.startY);
  if (distance > 6) {
    pointerState.moved = true;
    canvas.classList.add('is-dragging');
  }
  if (!pointerState.moved) return;

  const sprite = sprites[pointerState.index];
  const nextX = Math.max(0, Math.min(window.innerWidth - sprite.width, x - pointerState.offsetX));
  const nextY = Math.max(0, Math.min(window.innerHeight - sprite.height, y - pointerState.offsetY));
  sprite.x = nextX;
  sprite.y = nextY;
  if (canMoveSpriteTo(pointerState.index, nextX, nextY)) {
    pointerState.lastValidX = nextX;
    pointerState.lastValidY = nextY;
  }
});

const finishPointer = (event) => {
  if (!pointerState) return;
  const { x, y } = getPointerPosition(event);
  const wasDragged = pointerState.moved;
  const draggedIndex = pointerState.index;
  if (wasDragged && draggedIndex >= 0 && !canMoveSpriteTo(draggedIndex, sprites[draggedIndex].x, sprites[draggedIndex].y)) {
    sprites[draggedIndex].x = pointerState.lastValidX;
    sprites[draggedIndex].y = pointerState.lastValidY;
  }
  if (wasDragged) playClickSound();
  canvas.classList.remove('is-dragging');
  pointerState = null;
  if (!wasDragged) handleTap(x, y);
};

canvas.addEventListener('pointerup', finishPointer);
canvas.addEventListener('pointercancel', finishPointer);

Promise.all(images.map((image) => new Promise((resolve) => {
  image.addEventListener('load', resolve, { once: true });
}))).then(() => {
  resizeCanvas();
  initSprites();
  window.requestAnimationFrame(draw);
});
