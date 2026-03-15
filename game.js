// ==========================================
// OnePiece - Attrape les Chapeaux de Paille
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width;
let H = canvas.height;

// --- Éléments DOM ---
const hudNiveau = document.getElementById('hudNiveau');
const hudScore = document.getElementById('hudScore');
const startScreen = document.getElementById('startScreen');
const btnStart = document.getElementById('btnStart');
const quizModal = document.getElementById('quizModal');
const quizEtape = document.getElementById('quizEtape');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const quizFeedback = document.getElementById('quizFeedback');
const victoryScreen = document.getElementById('victoryScreen');
const btnRestart = document.getElementById('btnRestart');

// --- Quiz : mots français -> allemand ---
const motsQuiz = [
    { fr: 'livre', de: 'das Buch', faux: ['der Stift', 'das Heft'] },
    { fr: 'stylo', de: 'der Kugelschreiber', faux: ['die Feder', 'das Gummi'] },
    { fr: 'stylo plume', de: 'der Füller', faux: ['das Buch', 'der Marker'] },
    { fr: 'trousse', de: 'das Mäppchen', faux: ['das Lineal', 'der Spitzer'] },
    { fr: 'gomme', de: 'der Radiergummi', faux: ['der Marker', 'die Feder'] },
    { fr: 'marqueur', de: 'der Marker', faux: ['das Buch', 'das Mäppchen'] },
    { fr: 'taille-crayon', de: 'der Spitzer', faux: ['der Radiergummi', 'der Füller'] }
];

// --- État du jeu ---
let gameState = 'start'; // 'start', 'playing', 'quiz', 'victory'
let niveau = 1;
let baseSpeed = 2;
let vitesse = baseSpeed;
let chapeauxAttrapés = 0;
let chapeaux = [];
let particules = [];
let vagues = [];
let nuages = [];
let frameCount = 0;

const bonhomme = {
    x: W / 2 - 20,
    y: H - 85,
    w: 44,
    h: 64,
    speed: 6,
    direction: 0, // -1 gauche, 0 neutre, 1 droite
    frame: 0
};

const keys = {};

// --- Responsive canvas ---
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
    bonhomme.y = H - 85;
}
window.addEventListener('resize', () => {
    resizeCanvas();
    if (gameState === 'start') {
        initDecor();
    }
});

// --- Contrôles tactiles ---
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

function addTouchControl(btn, key) {
    const start = () => { keys[key] = true; };
    const end = () => { keys[key] = false; };
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); end(); }, { passive: false });
    btn.addEventListener('touchcancel', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
}
addTouchControl(btnLeft, 'ArrowLeft');
addTouchControl(btnRight, 'ArrowRight');

// --- Initialisation du décor ---
function initDecor() {
    nuages = [];
    for (let i = 0; i < 5; i++) {
        nuages.push({
            x: Math.random() * W,
            y: 20 + Math.random() * 60,
            w: 60 + Math.random() * 80,
            speed: 0.2 + Math.random() * 0.3
        });
    }
    vagues = [];
    for (let i = 0; i < 8; i++) {
        vagues.push({
            x: i * 110,
            offset: Math.random() * Math.PI * 2
        });
    }
}

// --- Dessin du décor mer/ciel OnePiece ---
function drawBackground() {
    // Ciel dégradé
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    skyGrad.addColorStop(0, '#1a3a5c');
    skyGrad.addColorStop(0.5, '#2a6faa');
    skyGrad.addColorStop(1, '#87ceeb');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.65);

    // Soleil couchant
    const sunX = W * 0.85;
    ctx.beginPath();
    ctx.arc(sunX, 80, 40, 0, Math.PI * 2);
    const sunGrad = ctx.createRadialGradient(sunX, 80, 5, sunX, 80, 45);
    sunGrad.addColorStop(0, '#fff4a0');
    sunGrad.addColorStop(0.6, '#ffd700');
    sunGrad.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Nuages
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const n of nuages) {
        n.x += n.speed;
        if (n.x > W + 80) n.x = -n.w;
        drawNuage(n.x, n.y, n.w);
    }

    // Mer
    const seaY = H * 0.65;
    const seaGrad = ctx.createLinearGradient(0, seaY, 0, H);
    seaGrad.addColorStop(0, '#1565c0');
    seaGrad.addColorStop(0.4, '#0d47a1');
    seaGrad.addColorStop(1, '#0a2e5c');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, seaY, W, H - seaY);

    // Vagues animées
    const t = frameCount * 0.03;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
            const y = seaY + 15 + row * 28 + Math.sin(x * 0.02 + t + row) * 6;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Pont du bateau (sol)
    const plankY = H - 70;
    ctx.fillStyle = '#6d4c2a';
    ctx.fillRect(0, plankY, W, 70);
    ctx.fillStyle = '#8b5e34';
    for (let i = 0; i < W; i += 100) {
        ctx.fillRect(i, plankY, 96, 70);
        ctx.strokeStyle = '#4a3018';
        ctx.lineWidth = 1;
        ctx.strokeRect(i, plankY, 96, 70);
    }
    // Ligne de séparation
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(0, plankY, W, 3);

    // Rambarde
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, plankY - 2);
    ctx.lineTo(W, plankY - 2);
    ctx.stroke();
    for (let x = 30; x < W; x += 80) {
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x, plankY - 30, 5, 30);
    }
    // Corde
    ctx.strokeStyle = '#a08060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 30; x < W; x += 80) {
        const nx = Math.min(x + 80, W - 30);
        ctx.moveTo(x + 2, plankY - 18);
        ctx.quadraticCurveTo((x + nx) / 2, plankY - 8, nx + 2, plankY - 18);
    }
    ctx.stroke();
}

function drawNuage(x, y, w) {
    const h = w * 0.35;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - w * 0.25, y + 4, w * 0.3, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.28, y + 3, w * 0.28, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
}

// --- Dessin du personnage (Luffy-like) ---
function drawBonhomme() {
    const bx = bonhomme.x + bonhomme.w / 2;
    const by = bonhomme.y;
    const dir = bonhomme.direction;
    const bob = Math.sin(frameCount * 0.1) * 2;

    ctx.save();
    ctx.translate(bx, by + bob);

    // Corps (gilet rouge)
    ctx.fillStyle = '#cc1100';
    ctx.beginPath();
    ctx.roundRect(-10, 16, 20, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-3, 16, 6, 24); // Ouverture du gilet

    // Pantalon bleu
    ctx.fillStyle = '#1a4a8a';
    ctx.fillRect(-10, 38, 9, 18);
    ctx.fillRect(1, 38, 9, 18);

    // Sandales
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(-10, 55, 9, 4);
    ctx.fillRect(1, 55, 9, 4);

    // Bras
    ctx.fillStyle = '#f5c6a0';
    ctx.save();
    ctx.translate(-12, 20);
    ctx.rotate(dir === -1 ? -0.3 : 0.1);
    ctx.fillRect(-3, 0, 6, 18);
    ctx.restore();
    ctx.save();
    ctx.translate(12, 20);
    ctx.rotate(dir === 1 ? 0.3 : -0.1);
    ctx.fillRect(-3, 0, 6, 18);
    ctx.restore();

    // Tête
    ctx.fillStyle = '#f5c6a0';
    ctx.beginPath();
    ctx.arc(0, 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Yeux
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-4, 6, 2, 0, Math.PI * 2);
    ctx.arc(4, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sourire
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 9, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Cicatrice sous l'oeil gauche
    ctx.strokeStyle = '#a00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.lineTo(-3, 14);
    ctx.stroke();

    // Cheveux noirs
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(0, -1, 14, 8, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Mèches
    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.quadraticCurveTo(-16, -4, -10, -6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.quadraticCurveTo(16, -4, 10, -6);
    ctx.fill();

    // Chapeau de paille de Luffy (sur la tête)
    drawStrawHat(0, -8, 1.1);

    ctx.restore();
}

// --- Dessin du chapeau de paille ---
function drawStrawHat(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Bord du chapeau
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8a96e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dome du chapeau
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.ellipse(0, -5, 12, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8a96e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bande rouge
    ctx.fillStyle = '#cc1100';
    ctx.fillRect(-12, -6, 24, 4);

    ctx.restore();
}

// --- Dessin d'un chapeau qui tombe ---
function drawFallingHat(x, y, rot) {
    ctx.save();
    ctx.translate(x + 20, y + 15);
    ctx.rotate(rot);
    drawStrawHat(0, 0, 1.3);
    ctx.restore();
}

// --- Particules (effet attrape) ---
function spawnParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particules.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: -Math.random() * 4 - 1,
            life: 25 + Math.random() * 15,
            color: Math.random() > 0.5 ? '#ffd700' : '#ff6600',
            size: 3 + Math.random() * 3
        });
    }
}

function updateParticles() {
    for (let i = particules.length - 1; i >= 0; i--) {
        const p = particules[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) particules.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particules) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// --- Gestion des chapeaux ---
function spawnChapeau() {
    chapeaux.push({
        x: Math.random() * (W - 40),
        y: -50,
        w: 40,
        h: 30,
        rot: (Math.random() - 0.5) * 0.5,
        rotSpeed: (Math.random() - 0.5) * 0.04
    });
}

function resetNiveau() {
    chapeaux = [];
    chapeauxAttrapés = 0;
    particules = [];
    for (let i = 0; i < 3; i++) spawnChapeau();
    bonhomme.x = W / 2 - bonhomme.w / 2;
    updateHUD();
}

function updateHUD() {
    hudNiveau.textContent = `Niveau : ${niveau}`;
    hudScore.textContent = `Chapeaux : ${chapeauxAttrapés} / 10`;
}

// --- Boucle de jeu ---
function gameLoop() {
    if (gameState !== 'playing') return;
    frameCount++;

    // Input
    if (keys['ArrowLeft']) {
        bonhomme.x -= bonhomme.speed;
        bonhomme.direction = -1;
    } else if (keys['ArrowRight']) {
        bonhomme.x += bonhomme.speed;
        bonhomme.direction = 1;
    } else {
        bonhomme.direction = 0;
    }
    bonhomme.x = Math.max(0, Math.min(W - bonhomme.w, bonhomme.x));

    // Mise à jour chapeaux
    for (const c of chapeaux) {
        c.y += vitesse;
        c.rot += c.rotSpeed;
    }

    // Collisions
    const bx = bonhomme.x;
    const by = bonhomme.y;
    const bw = bonhomme.w;
    const bh = bonhomme.h;
    for (let i = chapeaux.length - 1; i >= 0; i--) {
        const c = chapeaux[i];
        if (c.x < bx + bw && c.x + c.w > bx && c.y < by + bh && c.y + c.h > by) {
            spawnParticles(c.x + c.w / 2, c.y + c.h / 2);
            chapeaux.splice(i, 1);
            chapeauxAttrapés++;
            updateHUD();
            if (chapeauxAttrapés < 10) spawnChapeau();
        } else if (c.y > H + 40) {
            chapeaux.splice(i, 1);
            spawnChapeau();
        }
    }

    // Dessin
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    for (const c of chapeaux) drawFallingHat(c.x, c.y, c.rot);
    drawBonhomme();
    updateParticles();
    drawParticles();

    // Vérif fin d'étape
    if (chapeauxAttrapés >= 10) {
        gameState = 'quiz';
        setTimeout(showQuiz, 600);
        return;
    }

    // Spawn régulier
    if (frameCount % Math.max(40, 80 - niveau * 5) === 0 && chapeaux.length < 5 + niveau) {
        spawnChapeau();
    }

    requestAnimationFrame(gameLoop);
}

// --- Quiz ---
function showQuiz() {
    if (niveau - 1 >= motsQuiz.length) {
        showVictory();
        return;
    }

    const mot = motsQuiz[(niveau - 1) % motsQuiz.length];
    quizEtape.textContent = `Étape ${niveau} terminée !`;
    quizQuestion.textContent = `Comment traduit-on « ${mot.fr} » en allemand ?`;
    quizFeedback.textContent = '';
    quizOptions.innerHTML = '';

    const allOptions = [mot.de, ...mot.faux].sort(() => Math.random() - 0.5);

    for (const opt of allOptions) {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.addEventListener('click', () => handleQuizAnswer(btn, opt, mot.de));
        quizOptions.appendChild(btn);
    }

    quizModal.style.display = 'flex';
}

function handleQuizAnswer(btn, selected, correct) {
    const buttons = quizOptions.querySelectorAll('button');

    if (selected === correct) {
        btn.classList.add('correct');
        quizFeedback.style.color = '#4caf50';
        quizFeedback.textContent = 'Bonne réponse ! 🎉';
        buttons.forEach(b => { b.disabled = true; });

        setTimeout(() => {
            quizModal.style.display = 'none';
            niveau++;
            vitesse = baseSpeed + (niveau - 1) * 1.2;
            resetNiveau();
            if (niveau - 1 >= motsQuiz.length) {
                showVictory();
            } else {
                gameState = 'playing';
                requestAnimationFrame(gameLoop);
            }
        }, 1200);
    } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        quizFeedback.style.color = '#f88';
        quizFeedback.textContent = 'Mauvaise réponse, essaie encore !';
    }
}

function showVictory() {
    gameState = 'victory';
    victoryScreen.style.display = 'flex';
}

// --- Input clavier ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keys[e.key] = true;
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Démarrage ---
function startGame() {
    niveau = 1;
    vitesse = baseSpeed;
    chapeauxAttrapés = 0;
    chapeaux = [];
    particules = [];
    frameCount = 0;
    resizeCanvas();
    gameState = 'playing';
    initDecor();
    resetNiveau();
    requestAnimationFrame(gameLoop);
}

btnStart.addEventListener('click', () => {
    startScreen.style.display = 'none';
    startGame();
});

btnRestart.addEventListener('click', () => {
    victoryScreen.style.display = 'none';
    startGame();
});

// --- Init responsive + écran start ---
resizeCanvas();
initDecor();
(function drawStartBg() {
    if (gameState !== 'start') return;
    frameCount++;
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    requestAnimationFrame(drawStartBg);
})();
