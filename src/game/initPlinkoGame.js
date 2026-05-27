import Matter from 'matter-js';
import { GAME_CONFIG, calculateMultipliers } from '../config/gameConfig';

export default function initPlinkoGame() {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const cleanupCallbacks = [];
  const registerCleanup = (fn) => {
    if (typeof fn === 'function') {
      cleanupCallbacks.push(fn);
    }
  };

  // showModal("modal1")

  const finishButton = document.getElementById('finish');
  const handleFinishClick = () => {
    if (typeof window !== 'undefined' && typeof window.playableCTAClick === 'function') {
      window.playableCTAClick();
    }
  };

  if (finishButton) {
    finishButton.addEventListener('click', handleFinishClick);
    registerCleanup(() => finishButton.removeEventListener('click', handleFinishClick));
  }

          function showModal(modalId) {
              const modal = document.getElementById(modalId);
              if (modal) {
                  modal.classList.add('show');
              }
          }

          function hideModal(modalId) {
              const modal = document.getElementById(modalId);
              if (modal) {
                  modal.classList.remove('show');
              }
          }

          const Engine = Matter.Engine,
              Render = Matter.Render,
              Runner = Matter.Runner,
              Bodies = Matter.Bodies,
              Composite = Matter.Composite,
              Body = Matter.Body,
              Events = Matter.Events,
              Vector = Matter.Vector;

          (function () {
              const Engine = Matter.Engine,
                  Render = Matter.Render,
                  Runner = Matter.Runner,
                  Bodies = Matter.Bodies,
                  Composite = Matter.Composite,
                  Body = Matter.Body,
                  Vector = Matter.Vector;

              const engine = Engine.create({
                  gravity: { x: 0, y: 1 }
              });
              const world = engine.world;

              const width = 500;
              const height = 500;
              const containerRadius = 200;
              const centerX = width / 2;
              const centerY = height / 2;

              const existingCanvas = document.getElementById('balls-canvas');
              const render = Render.create({
                  canvas: existingCanvas,
                  engine: engine,
                  options: {
                      width: width,
                      height: height,
                      wireframes: false,
                  }
              });

        Render.run(render);
        registerCleanup(() => {
            Render.stop(render);
            Composite.clear(engine.world, false);
        });

              const runner = Runner.create();
              Runner.run(runner, engine);
              registerCleanup(() => {
                  Runner.stop(runner);
                  Render.stop(render);
                  Composite.clear(engine.world, false);
              });

              function isInsideCircle(x, y, centerX, centerY, radius) {
                  const dx = x - centerX;
                  const dy = y - centerY;
                  return dx * dx + dy * dy < radius * radius;
              }

              // Create the main circular container background
              const circleBg = Bodies.circle(centerX, centerY, containerRadius, {
                  isStatic: true,
                  isSensor: true,
                  render: {
                      fillStyle: '#1a0633',
                      strokeStyle: 'transparent'
                  },
                  collisionFilter: {
                      mask: 0
                  }
              });

              Composite.add(world, circleBg);

              const containerWalls = Composite.create();

              const segments = 30;
              const segmentAngle = (Math.PI * 2) / segments;

              for (let i = 0; i < segments; i++) {
                  const angle = i * segmentAngle;
                  const nextAngle = (i + 1) * segmentAngle;

                  const startX = centerX + containerRadius * Math.cos(angle);
                  const startY = centerY + containerRadius * Math.sin(angle);
                  const endX = centerX + containerRadius * Math.cos(nextAngle);
                  const endY = centerY + containerRadius * Math.sin(nextAngle);

                  const segmentLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                  const segmentMidX = (startX + endX) / 2;
                  const segmentMidY = (startY + endY) / 2;
                  const segmentAngleRad = Math.atan2(endY - startY, endX - startX);

                  const wall = Bodies.rectangle(
                      segmentMidX,
                      segmentMidY,
                      segmentLength,
                      5,
                      {
                          isStatic: true,
                          angle: segmentAngleRad,
                          render: {
                              visible: true,
                              fillStyle: '#460b8f'
                          }
                      }
                  );

                  Composite.add(containerWalls, wall);
              }

              Composite.add(world, containerWalls);

              const whiteGlow = Bodies.circle(centerX, centerY, containerRadius + 25, {
                  isStatic: true,
                  isSensor: true,
                  render: {
                      fillStyle: 'black',
                      strokeStyle: '#FEFC5A',
                      lineWidth: 30
                  },
                  collisionFilter: {
                      mask: 0
                  }
              });

              Composite.add(world, whiteGlow);

              const ringBody = Bodies.circle(centerX, centerY, containerRadius + 14, {
                  isStatic: true,
                  isSensor: true,
                  render: {
                      fillStyle: 'transparent',
                      strokeStyle: '#460b8f',
                      lineWidth: 40
                  },
                  collisionFilter: {
                      mask: 0
                  }
              });

              Composite.add(world, ringBody);

              function createGradientBall(x, y, radius, isBlue) {
                  const canvas = document.createElement('canvas');
                  const size = radius * 2;
                  canvas.width = size;
                  canvas.height = size;

                  const ctx = canvas.getContext('2d');

                  const grad = ctx.createRadialGradient(
                      size / 2, size / 2, 0,
                      size / 2, size / 2, radius
                  );

                  if (isBlue) {
                      grad.addColorStop(0, '#7d97e8');
                      grad.addColorStop(0.7, '#3462e0');
                  } else {
                      grad.addColorStop(0, '#E387F7');
                      grad.addColorStop(0.7, '#C119C1');
                  }

                  ctx.fillStyle = grad;
                  ctx.beginPath();
                  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
                  ctx.fill();

                  const ball = Bodies.circle(x, y, radius, {
                      restitution: 0.7,
                      friction: 0.1,
                      frictionAir: 0.01,
                      render: {
                          sprite: {
                              texture: canvas.toDataURL(),
                              xScale: 1,
                              yScale: 1
                          }
                      }
                  });

                  return ball;
              }

              const balls = [];
              const ballCount = 20;
              const ballRadius = 30;

              for (let i = 0; i < ballCount; i++) {
                  let x, y;
                  let validPosition = false;
                  let attempts = 0;

                  while (!validPosition && attempts < 100) {
                      const angle = Math.random() * Math.PI;
                      const distance = Math.random() * (containerRadius - ballRadius * 2 - 10);

                      x = centerX + distance * Math.cos(angle);
                      y = centerY + distance * Math.sin(angle);

                      if (isInsideCircle(x, y, centerX, centerY, containerRadius - ballRadius - 10)) {
                          let overlapping = false;
                          for (const other of balls) {
                              const dx = other.position.x - x;
                              const dy = other.position.y - y;
                              const distance = Math.sqrt(dx * dx + dy * dy);
                              if (distance < ballRadius * 2) {
                                  overlapping = true;
                                  break;
                              }
                          }

                          if (!overlapping) {
                              validPosition = true;
                          }
                      }

                      attempts++;
                  }

                  // Визначаємо, чи має кулька бути синьою (для половини куль)
                  const isBlue = i >= ballCount / 2;

                  const ball = createGradientBall(x, y, ballRadius, isBlue);
                  balls.push(ball);
                  Composite.add(world, ball);
              }

              let shakeTimer = 0;

              window.shakeTheBalls = function (intensity = 1) {
                  const shakeFactor = intensity || 1;
                  balls.forEach(ball => {
                      if (isInsideCircle(ball.position.x, ball.position.y, centerX, centerY, containerRadius - ballRadius)) {
                          const forceX = (Math.random() - 0.5) * 0.06 * shakeFactor;
                          const forceY = -Math.random() * 0.12 * shakeFactor;
                          Body.applyForce(ball, ball.position, {
                              x: forceX,
                              y: forceY
                          });
                      }
                  });
              };

              let autoShakeFrame;
              function startAutoShake() {
                  shakeTimer++;
                  if (shakeTimer % 30 === 0) {
                      window.shakeTheBalls(1);
                  }
                  autoShakeFrame = requestAnimationFrame(startAutoShake);
              }

              startAutoShake();
              registerCleanup(() => {
                  if (autoShakeFrame) {
                      cancelAnimationFrame(autoShakeFrame);
                  }
              });
              let rotationSpeed = 0.1;

              let rotateFrame;
              function rotateContainer() {
                  Composite.rotate(containerWalls, rotationSpeed, { x: centerX, y: centerY });
                  rotateFrame = requestAnimationFrame(rotateContainer);
              }

              rotateContainer();
              registerCleanup(() => {
                  if (rotateFrame) {
                      cancelAnimationFrame(rotateFrame);
                  }
              });
              window.getBalls = function () {
                  return balls;
              };
              registerCleanup(() => {
                  delete window.shakeTheBalls;
                  delete window.getBalls;
              });
          })();

          function createLeafSVG(color = "#36628c") {
              const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              svg.setAttribute("width", "50");
              svg.setAttribute("height", "50");
              svg.setAttribute("viewBox", "0 0 100 100");

              const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
              path1.setAttribute("d", "M50 10 C30 30, 20 50, 50 70 C80 50, 70 30, 50 10");
              path1.setAttribute("fill", color);

              const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
              path2.setAttribute("d", "M50 10 C70 30, 80 50, 50 70 C20 50, 30 30, 50 10");
              path2.setAttribute("fill", color);

              svg.appendChild(path1);
              svg.appendChild(path2);

              return svg;
          }

          const container = document.querySelector('.falling-leaves-container');

          function spawnLeaf() {
              const leaf = document.createElement('div');
              leaf.classList.add('leaf');

              const leftPosition = Math.random() * window.innerWidth;
              leaf.style.left = `${leftPosition}px`;

              leaf.style.top = '-100px';

              const leafSVG = createLeafSVG();
              leaf.appendChild(leafSVG);

              const fallDuration = Math.random() * 5 + 5;
              leaf.style.animation = `fall ${fallDuration}s linear forwards`;

              leaf.style.transform = `rotate(${Math.random() * 360}deg)`;
              leaf.style.scale = `${Math.random() + 1}`;

              container.appendChild(leaf);

              setTimeout(() => {
                  container.removeChild(leaf);
              }, fallDuration * 1000);
          }

          function startLeafSpawner() {
              const spawnInterval = Math.random() * 200 + 500;
              spawnLeaf();
              setTimeout(startLeafSpawner, spawnInterval);
          }

          // startLeafSpawner();

          const sounds = {
              mock: '/assets/sounds/iphone.mp3',
              trans: '/assets/sounds/whoosh.mp3',
              backgroundMusic: '/assets/sounds/background-music.mp3',
              buttonClick: '/assets/sounds/button-click.wav',
              hitGround: '/assets/sounds/hit-ground.mp3',
              finalSound: '/assets/sounds/final-sound.mp3'
          };

          const volumes = {
              backgroundMusic: 0.3,
          };

          let audioElements = {};
          let isMusicPlaying = false;
          let musicStarted = false;
          let audioUnlocked = false;
          let pageInBackground = false;
          let wasMusicPlayingBeforeBackground = false;
          let adVolume = 1;

          const getMraid = () => {
              if (typeof window === 'undefined' || !window.mraid || typeof window.mraid !== 'object') {
                  return null;
              }

              return window.mraid;
          };

          const isDocumentHidden = () => {
              return document.visibilityState === 'hidden' || document.hidden === true;
          };

          const getEffectiveVolume = (soundKey) => {
              return (volumes[soundKey] || 1) * adVolume;
          };

          const forEachAudio = (callback) => {
              Object.values(audioElements).forEach((audio) => {
                  if (audio) {
                      callback(audio);
                  }
              });
          };

          const syncMuteState = () => {
              const shouldMute = pageInBackground || isDocumentHidden() || adVolume <= 0;

              forEachAudio((audio) => {
                  audio.muted = shouldMute;
              });
          };

          const normalizeAdVolume = (value) => {
              const numericValue = Number(value);

              if (!Number.isFinite(numericValue)) {
                  return null;
              }

              const normalized = numericValue > 1 ? numericValue / 100 : numericValue;

              return Math.min(1, Math.max(0, normalized));
          };

          const applyAudioVolumes = () => {
              Object.entries(audioElements).forEach(([soundKey, audio]) => {
                  if (audio) {
                      audio.volume = getEffectiveVolume(soundKey);
                  }
              });
          };

          const setAdVolume = (value) => {
              const normalizedVolume = normalizeAdVolume(value);

              if (normalizedVolume === null) {
                  return;
              }

              adVolume = normalizedVolume;
              applyAudioVolumes();
              syncMuteState();

              if (adVolume <= 0 && audioElements.backgroundMusic) {
                  audioElements.backgroundMusic.pause();
                  return;
              }

              resumeFromBackground();
          };

          function pauseForBackground() {
              const wasAlreadyInBackground = pageInBackground;

              pageInBackground = true;

              if (!wasAlreadyInBackground) {
                  wasMusicPlayingBeforeBackground = Boolean(audioElements.backgroundMusic && !audioElements.backgroundMusic.paused);
              }

              syncMuteState();

              forEachAudio((audio) => {
                  audio.pause();
              });
          }

          function resumeFromBackground() {
              if (isDocumentHidden()) {
                  pageInBackground = true;
                  syncMuteState();
                  return;
              }

              pageInBackground = false;
              syncMuteState();

              if (!wasMusicPlayingBeforeBackground || !musicStarted || !audioUnlocked || adVolume <= 0) {
                  return;
              }

              playSound('backgroundMusic', { clearBackgroundIntent: true });
          }

          const handleVisibilityChange = () => {
              if (isDocumentHidden()) {
                  pauseForBackground();
                  return;
              }

              resumeFromBackground();
          };

          const handlePlayableViewabilityChange = (event) => {
              const isViewable = event?.detail?.viewable !== false;

              if (isViewable) {
                  resumeFromBackground();
                  return;
              }

              pauseForBackground();
          };

          const handleUserAudioInteraction = () => {
              audioUnlocked = true;

              if (musicStarted && pageInBackground && !isDocumentHidden()) {
                  resumeFromBackground();
                  return;
              }

              if (!musicStarted) {
                  musicStarted = true;
                  playSound('backgroundMusic');
                  return;
              }

              if (audioElements.backgroundMusic && audioElements.backgroundMusic.paused && !pageInBackground && !isDocumentHidden()) {
                  playSound('backgroundMusic');
              }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);
          window.addEventListener('blur', pauseForBackground);
          window.addEventListener('focus', resumeFromBackground);
          window.addEventListener('pagehide', pauseForBackground);
          window.addEventListener('pageshow', resumeFromBackground);
          window.addEventListener('playableViewabilityChange', handlePlayableViewabilityChange);
          document.addEventListener('click', handleUserAudioInteraction, { capture: true });
          document.addEventListener('touchstart', handleUserAudioInteraction, { passive: true, capture: true });
          document.addEventListener('pointerdown', handleUserAudioInteraction, { passive: true, capture: true });
          document.addEventListener('keydown', handleUserAudioInteraction, { capture: true });

          registerCleanup(() => {
              document.removeEventListener('visibilitychange', handleVisibilityChange);
              window.removeEventListener('blur', pauseForBackground);
              window.removeEventListener('focus', resumeFromBackground);
              window.removeEventListener('pagehide', pauseForBackground);
              window.removeEventListener('pageshow', resumeFromBackground);
              window.removeEventListener('playableViewabilityChange', handlePlayableViewabilityChange);
              document.removeEventListener('click', handleUserAudioInteraction, { capture: true });
              document.removeEventListener('touchstart', handleUserAudioInteraction, { capture: true });
              document.removeEventListener('pointerdown', handleUserAudioInteraction, { capture: true });
              document.removeEventListener('keydown', handleUserAudioInteraction, { capture: true });
              forEachAudio((audio) => {
                  audio.pause();
                  audio.src = '';
              });
          });

          function preloadSounds() {
              Object.keys(sounds).forEach(soundKey => {
                  try {
                      audioElements[soundKey] = new Audio(sounds[soundKey]);
                      audioElements[soundKey].volume = getEffectiveVolume(soundKey);

                      if (soundKey === 'backgroundMusic') {
                          audioElements[soundKey].loop = true;

                          // Track when music starts/stops
                          audioElements[soundKey].addEventListener('play', () => {
                              isMusicPlaying = true;
                          });
                          audioElements[soundKey].addEventListener('pause', () => {
                              isMusicPlaying = false;
                          });
                          audioElements[soundKey].addEventListener('ended', () => {
                              isMusicPlaying = false;
                          });
                      }

                      // Preload the audio
                      audioElements[soundKey].preload = 'auto';
                      syncMuteState();
                  } catch (e) {
                      console.error(`Error preloading sound ${soundKey}:`, e);
                  }
              });
          }

          function playSound(soundKey, options = {}) {
              if (!audioElements[soundKey]) {
                  console.warn(`Sound ${soundKey} not loaded yet`);
                  return;
              }

              if (adVolume <= 0 || pageInBackground || isDocumentHidden()) {
                  return;
              }

              try {
                  audioElements[soundKey].muted = false;
                  audioElements[soundKey].volume = getEffectiveVolume(soundKey);

                  // Special handling for background music
                  if (soundKey === 'backgroundMusic') {
                      // Only start if not already playing
                      if (!isMusicPlaying && audioElements[soundKey].paused) {
                          audioElements[soundKey].play().then(() => {
                              if (options.clearBackgroundIntent) {
                                  wasMusicPlayingBeforeBackground = false;
                              }
                          }).catch(e => {
                              console.error("Error playing background music:", e);
                          });
                      }
                  } else {
                      // For sound effects, restart from beginning
                      audioElements[soundKey].currentTime = 0;
                      audioElements[soundKey].play().catch(e => {
                          console.error(`Error playing sound ${soundKey}:`, e);
                      });
                  }
              } catch (e) {
                  console.error(`Error in playSound for ${soundKey}:`, e);
              }
          }

          function stopSound(soundKey) {
              if (audioElements[soundKey]) {
                  audioElements[soundKey].pause();
                  audioElements[soundKey].currentTime = 0;
              }
          }

          // Preload sounds immediately
          preloadSounds();

          const syncWithMraidAudio = () => {
              const mraid = getMraid();

              if (!mraid || typeof mraid.addEventListener !== 'function') {
                  return () => {};
              }

              const handleAudioVolumeChange = (volume) => {
                  setAdVolume(volume);
              };

              const handleMraidStateChange = (state) => {
                  if (state === 'hidden') {
                      pauseForBackground();
                      return;
                  }

                  if (state === 'default' || state === 'expanded' || state === 'resized') {
                      resumeFromBackground();
                  }
              };

              mraid.addEventListener('audioVolumeChange', handleAudioVolumeChange);
              mraid.addEventListener('stateChange', handleMraidStateChange);

              try {
                  if (typeof mraid.getAudioVolume === 'function') {
                      setAdVolume(mraid.getAudioVolume());
                  }

                  if (typeof mraid.getState === 'function' && mraid.getState() === 'hidden') {
                      pauseForBackground();
                  }
              } catch (_) {
                  // Ignore non-standard MRAID implementations.
              }

              return () => {
                  if (typeof mraid.removeEventListener === 'function') {
                      mraid.removeEventListener('audioVolumeChange', handleAudioVolumeChange);
                      mraid.removeEventListener('stateChange', handleMraidStateChange);
                  }
              };
          };

          const removeMraidAudioSync = syncWithMraidAudio();
          registerCleanup(removeMraidAudioSync);
          const width = 800;
          const height = 660;

          let fallenBalls = 0;
          let flag = true;
          const maxBalls = 5;

          const prizes = document.getElementsByClassName("prizes");
          const multipliers = calculateMultipliers();
          console.log('Calculated multipliers:', multipliers);

          let balls = 0;
          const baseBetAmount = GAME_CONFIG.defaultBet || 10;

          // Calculate expected winnings per drop for perfect balance
          const totalWinNeeded = GAME_CONFIG.targetBalance - GAME_CONFIG.defaultBalance;
          const totalBetCost = baseBetAmount * GAME_CONFIG.ballDropIndices.length;
          const perfectWinPerDrop = (totalWinNeeded + totalBetCost) / GAME_CONFIG.ballDropIndices.length;
          let click = 0;
          const ballsEl = document.getElementById("balls");
          const ballsWrapp = document.getElementById("balls-wrapp");
          const finalPrize = document.getElementById("finalPrize");
          const mainBackground = document.querySelector(".main-container");
          let ballCounter = 0;
          let ballIdCounter = 0;
          const processedBalls = new Set();

          let activeBalls = 0;

          const updateBalanceDisplay = () => {
              if (ballsEl) {
                  ballsEl.innerHTML = `${balls} ${GAME_CONFIG.currency}`;
              }
          };

          const showWinPopup = (amount, x, y) => {
              const canvasContainer = document.querySelector('.canvas-container');
              if (!canvasContainer) return;

              const popup = document.createElement('div');
              popup.className = 'win-popup';

              // Determine if positive or negative
              const netAmount = amount - baseBetAmount;
              if (netAmount > 0) {
                  popup.classList.add('positive');
                  popup.textContent = `+${netAmount}${GAME_CONFIG.currency}`;
              } else {
                  popup.classList.add('negative');
                  popup.textContent = `${netAmount}${GAME_CONFIG.currency}`;
              }

              // Position the popup relative to canvas container
              const canvas = document.getElementById('canvas');
              const canvasRect = canvas.getBoundingClientRect();
              const containerRect = canvasContainer.getBoundingClientRect();

              // Convert game coordinates to screen coordinates
              const screenX = x / width * canvasRect.width;
              const screenY = canvasRect.height - 50; // Near bottom of canvas

              popup.style.left = `${screenX}px`;
              popup.style.top = `${screenY}px`;

              canvasContainer.appendChild(popup);

              // Remove popup after animation
              setTimeout(() => {
                  if (popup.parentNode) {
                      popup.parentNode.removeChild(popup);
                  }
              }, 2000);
          };

          updateBalanceDisplay();

          const setPlayerBalance = (value = 0) => {
              const parsed = Math.max(0, Math.floor(Number(value) || 0));
              balls = parsed;
              updateBalanceDisplay();
          };

          const getPlayerBalance = () => {
              return balls;
          };

          window.setPlayerBalance = setPlayerBalance;
          window.getPlayerBalance = getPlayerBalance;
          registerCleanup(() => {
              delete window.setPlayerBalance;
              delete window.getPlayerBalance;
          });

          // Collision categories для м'ячиків та стін
          const COLLISION_CATEGORIES = {
              // М'ячики (5 різних категорій)
              BALL_1: 0x0001,
              BALL_2: 0x0002,
              BALL_3: 0x0004,
              BALL_4: 0x0008,
              BALL_5: 0x0010,

              // Індивідуальні стіни для кожного м'ячика
              WALL_1: 0x0020,
              WALL_2: 0x0040,
              WALL_3: 0x0080,
              WALL_4: 0x0100,
              WALL_5: 0x0200,

              // Універсальні об'єкти (взаємодіють з усіма м'ячиками)
              UNIVERSAL: 0x0400,  // Стіни для всіх м'ячиків
              PEGS: 0x0800,       // Пеги
              GROUND: 0x1000,     // Земля
              SPECIAL: 0x2000     // Спеціальні об'єкти
          };

          // Масиви для зручності
          const ballCategories = [
              COLLISION_CATEGORIES.BALL_1,
              COLLISION_CATEGORIES.BALL_2,
              COLLISION_CATEGORIES.BALL_3,
              COLLISION_CATEGORIES.BALL_4,
              COLLISION_CATEGORIES.BALL_5
          ];

          const wallCategories = [
              COLLISION_CATEGORIES.WALL_1,
              COLLISION_CATEGORIES.WALL_2,
              COLLISION_CATEGORIES.WALL_3,
              COLLISION_CATEGORIES.WALL_4,
              COLLISION_CATEGORIES.WALL_5
          ];

          // Маска для всіх м'ячиків (для універсальних об'єктів)
          const ALL_BALLS_MASK = COLLISION_CATEGORIES.BALL_1 | COLLISION_CATEGORIES.BALL_2 |
              COLLISION_CATEGORIES.BALL_3 | COLLISION_CATEGORIES.BALL_4 |
              COLLISION_CATEGORIES.BALL_5;

          function createGradientTexture(radius, colorStart, colorEnd) {
              const canvas = document.createElement('canvas');
              const size = radius * 2;
              canvas.width = size;
              canvas.height = size;

              const ctx = canvas.getContext('2d');

              const grad = ctx.createRadialGradient(
                  size / 2, size / 2, 0,
                  size / 2, size / 2, radius
              );

              grad.addColorStop(0, colorStart);
              grad.addColorStop(0.7, colorEnd);

              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
              ctx.fill();

              return canvas.toDataURL();
          }

          function dropABall() {
              // Dispatch ball drop start event
              window.dispatchEvent(new Event('ballDropStart'));

              ballCounter++;

              const dropLeft = width / 2 - 10;
              const dropRight = width / 2 + 10;
              const dropWidth = dropRight - dropLeft;
              let x = width / 2 + (Math.random() * 80 - 40);
              if (ballCounter === 5) {
                  x = width / 2 + 30;
              }

              const ballColors = [
                  { start: '#E387F7', end: '#C119C1' },
                  { start: '#E387F7', end: '#C119C1' },
                  { start: '#E387F7', end: '#C119C1' },
                  { start: '#E387F7', end: '#C119C1' },
                  { start: '#E387F7', end: '#C119C1' },
              ];

              const y = -PEG_RAD;
              const ballId = `ball_${ballIdCounter++}`;

              // Визначаємо індекс м'ячика (0-4, циклічно)
              const ballIndex = (ballCounter - 1) % 5;
              const colorIndex = ballIndex;

              const ball = Bodies.circle(x, y, BALL_RAD, {
                  label: "Ball",
                  ballId: ballId,
                  restitution: 0.6,
                  ballNumber: ballCounter,
                  ballIndex: ballIndex,
                  render: {
                      sprite: {
                          texture: createGradientTexture(BALL_RAD, ballColors[colorIndex].start, ballColors[colorIndex].end),
                          xScale: 1,
                          yScale: 1
                      }
                  },
                  collisionFilter: {
                      group: 0,
                      category: ballCategories[ballIndex],
                      mask: wallCategories[ballIndex] | COLLISION_CATEGORIES.UNIVERSAL |
                          COLLISION_CATEGORIES.PEGS | COLLISION_CATEGORIES.GROUND |
                          COLLISION_CATEGORIES.SPECIAL
                  }
              });

              Composite.add(engine.world, [ball]);
              activeBalls++;
          }

          function createAllIndividualWalls() {
              for (let i = 0; i < 5; i++) {
                  createIndividualWallsForBall(i);
              }
          }

          const wallSettings = [
              {
                  angleLeft: -Math.PI / 6.78,
                  angleRight: Math.PI / 6.78,
                  xLeft: -312,
                  xRight: 56,
              },
              {
                  angleLeft: -Math.PI / 6.78,
                  angleRight: Math.PI / 6.78,
                  xLeft: -374,
                  xRight: -8,
              },
              {
                  angleLeft: -Math.PI / 6.78,
                  angleRight: Math.PI / 6.78,
                  xLeft: -56,
                  xRight: 313,
              },
              {
                  angleLeft: -Math.PI / 6.78,
                  angleRight: Math.PI / 6.78,
                  xLeft: -439,
                  xRight: -72,
              },
              {
                  angleLeft: -Math.PI / 6.78,
                  angleRight: Math.PI / 6.78,
                  xLeft: 137,
                  xRight: 503,
              },
          ]

          function createIndividualWallsForBall(ballIndex) {
              const wallHeight = height;
              const wallWidth = 10;
              let fillStyle = `hsl(${ballIndex * 72}, 70%, 60%)`;
              fillStyle = "transparent"

              const baseY = height / 2 + 10;
              const leftX = width / 2 + wallSettings[ballIndex].xLeft;
              const rightX = width / 2 + wallSettings[ballIndex].xRight;

              const leftWall = Bodies.rectangle(leftX, baseY, wallWidth, wallHeight, {
                  isStatic: true,
                  label: `IndividualWall_${ballIndex}_Left`,
                  angle: wallSettings[ballIndex].angleLeft,
                  render: {
                      fillStyle: fillStyle,
                  },
                  collisionFilter: {
                      group: 0,
                      category: wallCategories[ballIndex],
                      mask: ballCategories[ballIndex]
                  }
              });

              const rightWall = Bodies.rectangle(rightX, baseY, wallWidth, wallHeight, {
                  isStatic: true,
                  label: `IndividualWall_${ballIndex}_Right`,
                  angle: wallSettings[ballIndex].angleRight,
                  render: {
                      fillStyle: fillStyle,
                  },
                  collisionFilter: {
                      group: 0,
                      category: wallCategories[ballIndex],
                      mask: ballCategories[ballIndex]
                  }
              });

              Composite.add(engine.world, [leftWall, rightWall]);
          }

          function createUniversalWalls() {
              const wallHeight = height;
              const wallWidth = 10;
              let fillStyle = "red";
              fillStyle = "transparent";

              const universalWall1 = Bodies.rectangle(width / 2 - 210, height / 2 + 10, wallWidth, wallHeight, {
                  isStatic: true,
                  label: 'UniversalWall_1',
                  angle: Math.PI / 6.78,
                  render: {
                      fillStyle: fillStyle,
                  },
                  collisionFilter: {
                      group: 0,
                      category: COLLISION_CATEGORIES.UNIVERSAL,
                      mask: ALL_BALLS_MASK // Взаємодіє з усіма м'ячиками
                  }
              });

              const universalWall2 = Bodies.rectangle(width / 2 + 210, height / 2 + 10, wallWidth, wallHeight, {
                  isStatic: true,
                  label: 'UniversalWall_2',
                  angle: -Math.PI / 6.78,
                  render: {
                      fillStyle: fillStyle,
                  },
                  collisionFilter: {
                      group: 0,
                      category: COLLISION_CATEGORIES.UNIVERSAL,
                      mask: ALL_BALLS_MASK
                  }
              });

              Composite.add(engine.world, [universalWall1, universalWall2]);
          }

          const dropButton = document.getElementById('drop-button');
          const handleDropClick = () => {
              dropABall();
              click++;
              if (click >= 5 && dropButton) {
                  dropButton.disabled = true;
              }

              playSound('buttonClick');
              window.shakeTheBalls(1.5);
          };

          if (dropButton) {
              dropButton.addEventListener('click', handleDropClick);
              registerCleanup(() => dropButton.removeEventListener('click', handleDropClick));
          }

          function createPegTexture(radius) {
              const canvas = document.createElement('canvas');
              const size = radius * 10.5;
              canvas.width = size;
              canvas.height = size;

              const ctx = canvas.getContext('2d');
              const centerX = size / 2;
              const centerY = size / 2;

              ctx.beginPath();
              ctx.arc(centerX, centerY + radius * 0.3, radius * 1.1, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.fillStyle = '#fff';
              ctx.fill();

              const gradHighlight = ctx.createRadialGradient(
                  centerX - radius * 0.3, centerY - radius * 0.3, 0,
                  centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.8
              );
              gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
              gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.fillStyle = gradHighlight;
              ctx.fill();

              return canvas.toDataURL();
          }

          // Engine setup
          const engine = Engine.create({
              gravity: {
                  scale: 0.0007
              }
          });

          const canvas = document.getElementById("canvas");
          const render = Render.create({
              canvas,
              engine,
              options: {
                  width,
                  height,
                  wireframes: false,
                  background: "transparent"
              }
          });

          // Game constants
          const GAP = 64;
          const PEG_RAD = 8;
          const BALL_RAD = 14;
          const pegs = [];
          const MAX_ROWS = 10;
          const PEGS_IN_FIRST_ROW = 3;
          const MAX_PEGS_LAST_ROW = 12;

          function createNeonPegTexture(radius, color = "#00e4ff") {
              const canvas = document.createElement('canvas');
              const size = radius * 12;
              canvas.width = size;
              canvas.height = size;

              const ctx = canvas.getContext('2d');
              const centerX = size / 2;
              const centerY = size / 2;

              const glow = ctx.createRadialGradient(
                  centerX, centerY, radius * 0.5,
                  centerX, centerY, radius * 4
              );
              glow.addColorStop(0, color);
              glow.addColorStop(0.5, color + "77");
              glow.addColorStop(1, "transparent");

              ctx.beginPath();
              ctx.arc(centerX, centerY, radius * 4, 0, Math.PI * 2);
              ctx.fillStyle = glow;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(centerX, centerY + radius * 0.3, radius * 1.1, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.fill();

              const gradHighlight = ctx.createRadialGradient(
                  centerX - radius * 0.3, centerY - radius * 0.3, 0,
                  centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.8
              );
              gradHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
              gradHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.fillStyle = gradHighlight;
              ctx.fill();

              return canvas.toDataURL();
          }

          // Створення пегів з правильною collision категорією
          for (let r = 0; r < MAX_ROWS; r++) {
              const pegsInRow = PEGS_IN_FIRST_ROW + r;

              for (let c = 0; c < pegsInRow; c++) {
                  const x = width / 2 + (c - (pegsInRow - 1) / 2) * GAP;
                  const y = GAP + r * GAP;

                  const peg = Bodies.circle(x, y, PEG_RAD, {
                      isStatic: true,
                      label: "Peg",
                      render: {
                          sprite: {
                              texture: createPegTexture(PEG_RAD),
                              xScale: 1,
                              yScale: 1
                          }
                      },
                      collisionFilter: {
                          group: 0,
                          category: COLLISION_CATEGORIES.PEGS,
                          mask: ALL_BALLS_MASK // Пеги взаємодіють з усіма м'ячиками
                      }
                  });

                  pegs.push(peg);
              }
          }
          Composite.add(engine.world, pegs);

          // Створення землі з правильною collision категорією
          const ground = Bodies.rectangle(width / 2, height + 30, width * 2, 40, {
              isStatic: true,
              label: "Ground",
              render: {
                  fillStyle: '#4CAF50'
              },
              collisionFilter: {
                  group: 0,
                  category: COLLISION_CATEGORIES.GROUND,
                  mask: ALL_BALLS_MASK // Земля взаємодіє з усіма м'ячиками
              }
          });

          Composite.add(engine.world, [ground]);

          // Створення всіх стін при ініціалізації
          createAllIndividualWalls();
          createUniversalWalls();

          // Решта коду залишається незмінною...
          const specialPegInterval = setInterval(() => {
              const bodies = Composite.allBodies(engine.world);
              for (let i = 0; i < bodies.length; i++) {
                  const peg = bodies[i];
                  if (peg.label === "SpecialPeg") {
                      const scale = 1 + 0.1 * Math.sin(Date.now() / 300);
                      Body.scale(peg, scale, scale);
                      Body.setStatic(peg, true);
                  }
              }
          }, 100);
          registerCleanup(() => clearInterval(specialPegInterval));

          // Collision handling
          function checkCollision(event, label1, label2, callback) {
              event.pairs.forEach(({ bodyA, bodyB }) => {
                  let body1, body2;
                  if (bodyA.label === label1 && bodyB.label === label2) {
                      body1 = bodyA;
                      body2 = bodyB;
                  } else if (bodyA.label === label2 && bodyB.label === label1) {
                      body1 = bodyB;
                      body2 = bodyA;
                  }

                  if (body1 && body2) {
                      callback(body1, body2);
                  }
              });
          }

        const collisionHandler = (event) => {
            event.pairs.forEach(({ bodyA, bodyB }) => {
                if ((bodyA.label === "Ball" && bodyB.label === "SpecialPeg") ||
                    (bodyA.label === "SpecialPeg" && bodyB.label === "Ball")) {

                      const ball = bodyA.label === "Ball" ? bodyA : bodyB;
                      const peg = bodyA.label === "SpecialPeg" ? bodyA : bodyB;
                      const originalTexture = peg.render.sprite.texture;

                      setTimeout(() => {
                          peg.render.sprite.texture = originalTexture;
                      }, 150);

                      const force = 0.0005;
                      const angle = Math.random() * Math.PI * 2;
                      Body.applyForce(ball, ball.position, {
                          x: Math.cos(angle) * force,
                          y: Math.sin(angle) * force
                      });
                  }

                  checkCollision(event, "Ball", "Ground", (ballToRemove) => {
                      if (ballToRemove.ballId && processedBalls.has(ballToRemove.ballId)) {
                          return;
                      }

                      if (ballToRemove.ballId) {
                          processedBalls.add(ballToRemove.ballId);
                      }

                      const index = Math.floor(
                          (ballToRemove.position.x - width / 2) / GAP + (MAX_PEGS_LAST_ROW - 1) / 2
                      );

                      if (index >= 0 && index < MAX_PEGS_LAST_ROW) {
                          if (prizes && prizes[0] && prizes[0].children && prizes[0].children[index]) {
                              const prizeElement = prizes[0].children[index];
                              prizeElement.classList.add("prizes-bounce");

                              prizeElement.addEventListener('animationend', () => {
                                  prizeElement.classList.remove("prizes-bounce");
                              }, { once: true });
                          }
                          console.log(multipliers[index]);

                        // Calculate winnings based on bet amount and multiplier
                        const ballsWon = Math.floor(baseBetAmount * multipliers[index]);
                        balls += ballsWon;

                        // Show win/loss popup
                        showWinPopup(ballsWon, ballToRemove.position.x, ballToRemove.position.y);

                        // If this is the last ball (5th), set balance to exact target
                        if (fallenBalls === 4) {
                            balls = GAME_CONFIG.targetBalance;
                        }

                        updateBalanceDisplay();

                        if (ballsWon != 0 && ballsWrapp) {
                            ballsWrapp.style.transition = "transform 0.2s ease-in-out";
                            ballsWrapp.style.transform = "scale(1.2)";
                            setTimeout(() => {
                                ballsWrapp.style.transform = "";
                            }, 250);
                        }
                      }

                      Matter.Composite.remove(engine.world, ballToRemove);

                      setTimeout(() => {
                          if (ballToRemove.ballId) {
                              if (balls < 5000) {
                                  playSound('hitGround');
                              }

                              processedBalls.delete(ballToRemove.ballId);
                              fallenBalls++;
                              activeBalls--;

                              // Dispatch ball drop end event when ball is removed
                              window.dispatchEvent(new Event('ballDropEnd'));

                              if (fallenBalls >= 5) {
                                  setTimeout(() => {
                                      showModal("modal1");
                                      playSound("finalSound");
                                  }, 1000);
                              }
                          }
                      }, 100);
                  });

                  checkCollision(event, "Peg", "Ball", (pegToAnimate) => {
                      const index = pegs.findIndex((peg) => peg === pegToAnimate);
                      if (index === -1) {
                          throw new Error(
                              "Could not find peg in pegs array even though we registered an ball hitting this peg"
                          );
                      }
                });
            });
        };

        Matter.Events.on(engine, "collisionStart", collisionHandler);
        registerCleanup(() => Events.off(engine, "collisionStart", collisionHandler));

          Render.run(render);

        const ctx = canvas.getContext("2d");
        let mainLoopFrame;
        function run() {
            const now = new Date().getTime();
            Engine.update(engine, 1000 / 60);
            mainLoopFrame = requestAnimationFrame(run);
        }

        // Anti-stuck mechanism
        const antiStuckInterval = setInterval(() => {
            const bodies = Composite.allBodies(engine.world);
            for (let i = 0; i < bodies.length; i++) {
                const ball = bodies[i];
                if (ball.label === "Ball") {
                    const isStuck = Math.abs(ball.velocity.x) < 0.05 &&
                          Math.abs(ball.velocity.y) < 0.05 &&
                          ball.position.y < height - 20;

                      if (isStuck) {
                          const nudgeX = (Math.random() - 0.5) * 0.0005;
                          const nudgeY = 0.0005;

                          Matter.Body.applyForce(ball, ball.position, {
                              x: nudgeX,
                              y: nudgeY
                          });
                      }
                  }
            }
        }, 1000);

        run();
        registerCleanup(() => {
            if (mainLoopFrame) {
                cancelAnimationFrame(mainLoopFrame);
            }
            clearInterval(antiStuckInterval);
        });

  return () => {
    while (cleanupCallbacks.length) {
      const cleanup = cleanupCallbacks.pop();
      try {
        cleanup();
      } catch (error) {
        console.error('Error cleaning up Plinko game', error);
      }
    }
  };
}
