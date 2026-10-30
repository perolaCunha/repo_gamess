const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------- ECONOMIA DE PONTOS ----------
const ROW_POINTS = [50, 40, 30, 20, 10];
const ROW_COLORS = ["#f74780", "#fc6998", "#fa8fb1", "#ffc1d5", "#c"];

// do topo (que valem mais). Os blindados ficam nos cantos de cima: mais pontos
// (50) mas custam 2 hits.
const LEVEL = [
    "..A####A..", // 50 pts
    ".########.", // 40 pts
    "####..####", // 30 pts  <- o buraco comeca aqui
    "###....###", // 20 pts
    "##......##", // 10 pts
];

// ---------- CONFIGURACAO ----------
const BRICK_W = 40, BRICK_H = 16, BRICK_GAP = 4;
const BRICK_TOP = 50;
const BRICK_LEFT = Math.round((canvas.width - (LEVEL[0].length * BRICK_W + (LEVEL[0].length - 1) * BRICK_GAP)) / 2);

const BALL_SPEED = 280;      // px/s
const MAX_BOUNCE = 60;       // angulo maximo (graus) nas pontas da raquete
const START_LIVES = 3;

// ---------- ESTADO ----------
const paddle = { w: 80, h: 10, x: 0, y: canvas.height - 30, speed: 380 };
const ball = { x: 0, y: 0, r: 6, vx: 0, vy: 0, stuck: true };
let bricks = [];
let score = 0;
let lives = START_LIVES;
let state = "ready"; // ready | playing | won | lost
const keys = { left: false, right: false };
let last = 0;

// ---------- LEVEL -> ARRAY DE BRICKS ----------
function buildBricks() {
    bricks = [];
    for (let row = 0; row < LEVEL.length; row++) {
        for (let col = 0; col < LEVEL[row].length; col++) {
            const c = LEVEL[row][col];
            if (c === ".") continue;
            bricks.push({
                x: BRICK_LEFT + col * (BRICK_W + BRICK_GAP),
                y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
                w: BRICK_W, h: BRICK_H,
                row: row,
                hp: c === "A" ? 2 : 1, // hit count (como inimigo com 2 HP)
                maxHp: c === "A" ? 2 : 1,
                points: ROW_POINTS[row],
            });
        }
    }
}
 
function resetBall() {
    ball.stuck = true;
    ball.vx = 0;
    ball.vy = 0;
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 1;
}
 
function newGame() {
    score = 0;
    lives = START_LIVES;
    paddle.x = (canvas.width - paddle.w) / 2;
    buildBricks();
    resetBall();
    state = "ready";
}
 
function launch() {
    if (!ball.stuck) return;
    ball.stuck = false;
    const angle = (Math.random() * 40 - 20) * Math.PI / 180; // leve desvio aleatorio
    ball.vx = BALL_SPEED * Math.sin(angle);
    ball.vy = -BALL_SPEED * Math.cos(angle); // sobe
    state = "playing";
}
 
// ---------- ENTRADA ----------
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === " ") {
        e.preventDefault();
        if (state === "won" || state === "lost") newGame();
        else launch();
    }
});
window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
});
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    paddle.x = mx - paddle.w / 2;
});
canvas.addEventListener("click", () => {
    if (state === "won" || state === "lost") newGame();
    else launch();
});
 
// ---------- COLISOES ----------
// Quique na raquete: so vale quando a bola esta DESCENDO (vy > 0),
// assim ela nunca "gruda" na raquete. O angulo depende de onde bateu:
// centro = vertical, pontas = ate MAX_BOUNCE graus.
function bounceOnPaddle() {
    if (ball.vy <= 0) return; // so quica se vy > 0
    const hitsX = ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w;
    const hitsY = ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h + ball.r;
    if (!hitsX || !hitsY) return;
 
    let rel = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1 .. 1
    rel = Math.max(-1, Math.min(1, rel));
    const angle = rel * MAX_BOUNCE * Math.PI / 180;
    ball.vx = BALL_SPEED * Math.sin(angle);
    ball.vy = -BALL_SPEED * Math.cos(angle); // sempre para cima
    ball.y = paddle.y - ball.r - 0.5;        // tira a bola de dentro da raquete
}
 
function bounceOnBricks() {
    for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        // ponto mais proximo do circulo dentro do retangulo
        const nx = Math.max(b.x, Math.min(ball.x, b.x + b.w));
        const ny = Math.max(b.y, Math.min(ball.y, b.y + b.h));
        const dx = ball.x - nx;
        const dy = ball.y - ny;
        if (dx * dx + dy * dy > ball.r * ball.r) continue;
 
        // decide se foi batida lateral ou vertical pela menor penetracao
        const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
        const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
        if (overlapX < overlapY) {
            ball.vx *= -1;
            ball.x += ball.x < b.x + b.w / 2 ? -overlapX : overlapX;
        } else {
            ball.vy *= -1;
            ball.y += ball.y < b.y + b.h / 2 ? -overlapY : overlapY;
        }
 
        b.hp -= 1; // um hit
        if (b.hp <= 0) {
            score += b.points;
            bricks.splice(i, 1);
        }
        return; // 1 tijolo por passo
    }
}
 
// ---------- UPDATE ----------
function update(dt) {
    if (state === "won" || state === "lost") return;
 
    // raquete (teclado)
    if (keys.left) paddle.x -= paddle.speed * dt;
    if (keys.right) paddle.x += paddle.speed * dt;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
 
    if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 1;
        return;
    }
 
    // passos curtos para a bola nao atravessar tijolo em frame lento
    const dist = Math.hypot(ball.vx, ball.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 4));
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
        ball.x += ball.vx * sdt;
        ball.y += ball.vy * sdt;
 
        // paredes
        if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
        if (ball.x + ball.r > canvas.width) { ball.x = canvas.width - ball.r; ball.vx = -Math.abs(ball.vx); }
        if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
 
        bounceOnPaddle();
        bounceOnBricks();
 
        // perdeu a bola
        if (ball.y - ball.r > canvas.height) {
            lives -= 1;
            if (lives <= 0) { state = "lost"; }
            else { resetBall(); state = "ready"; }
            return;
        }
    }
 
    if (bricks.length === 0) state = "won";
}
 
// ---------- DRAW ----------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
 
    // tijolos
    for (const b of bricks) {
        ctx.fillStyle = b.maxHp === 2
            ? (b.hp === 2 ? "#7e092eff" : ROW_COLORS[b.row]) // blindado: cinza -> cor da fileira (rachado)
            : ROW_COLORS[b.row];
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.maxHp === 2) {
            ctx.strokeStyle = b.hp === 2 ? "#ffff72" : "#ffff72";
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
        }
    }
 
    // raquete
    ctx.fillStyle = "#ffff72";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
 
    // bola
    ctx.fillStyle = "#ffff72";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
 
    // HUD
    ctx.fillStyle = "#ffff72";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Pontos: " + score, 12, 20);
    ctx.textAlign = "right";
    ctx.fillText("Vidas: " + lives, canvas.width - 12, 20);
 
    ctx.textAlign = "center";
    if (state === "ready") {
        ctx.fillText("ESPACO ou clique para lancar | setas/A-D ou mouse movem", canvas.width / 2, canvas.height / 2 + 60);
    }
    if (state === "won") {
        ctx.font = "28px Arial";
        ctx.fillText("Nivel limpo! " + score + " pts", canvas.width / 2, canvas.height / 2 + 40);
        ctx.font = "14px Arial";
        ctx.fillText("ESPACO para jogar de novo", canvas.width / 2, canvas.height / 2 + 66);
    }
    if (state === "lost") {
        ctx.font = "28px Arial";
        ctx.fillText("Fim de jogo - " + score + " pts", canvas.width / 2, canvas.height / 2 + 40);
        ctx.font = "14px Arial";
        ctx.fillText("ESPACO para tentar de novo", canvas.width / 2, canvas.height / 2 + 66);
    }
}
 
// ---------- LOOP (igual ao base game) ----------
function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}
 
newGame();
requestAnimationFrame(loop);
 
 