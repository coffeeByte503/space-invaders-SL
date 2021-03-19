const $ = element => document.querySelector(element);
let gravity = 0.003;
const ships = [
    {
        price: 320,
        life: 3000
    }

]
const levels = {
    level1: {
        bg: "bg-1",
        enemies: [
            {
                name: "enemy-1",
                color: "#b056cf",
                score: 5,
                life: 60,
                damage: 20,
                margin: [10, 10],
                size: [32, 32]
            },
            {
                name: "enemy-2",
                color: "#688ed5",
                score: 10,
                life: 130,
                damage: 30,
                margin: [2, 5],
                size: [52, 32]
            }
        ],
        eWidth: 64,
        eHeight: 64,
        audioBG: "bg1"
    }

}

//functions 
function sleep(milis) { return new Promise(resolve => setTimeout(resolve, milis)) };
function sum(/**/) {
    let sum = 0;
    for (let value of arguments) sum += value;
    return Number(sum);
}
class SpriteSheet {
    constructor(img, context) {
        this.img = img;
        this.width = this.img.width;
        this.height = this.img.height;
        this.frame = []
        this.length = 0;
        this.names = []
        this.context = context;
    }
    define(name, x, y, width, height) {
        const buffer = document.createElement("canvas");
        buffer.width = width == undefined ? this.width : width;
        buffer.height = height == undefined ? this.height : height;
        const context = buffer.getContext("2d");
        context.drawImage(this.img,
            x * buffer.width,
            y * buffer.height,
            this.width,
            this.height,
            0, 0,
            this.width,
            this.height
        );
        this.frame.push(buffer);
        this.names.push(name);
        this.__proto__[name] = buffer;
    }
    defineSprite(json) {
        let values = []
        for (let i = 0; i < json.length; i++) {
            values = [];
            for (let j = 0; j < json[i].length; j++) {
                values.push(json[i][j])
            }
            this.define(...values)
            this.length++;
        }
        return { frame: this.frame };
    }
    drawFrame(frame, x, y, w, h) {
        this.context.drawImage(this.frame[frame], x, y, w, h);
    }

}
const Engine = {
    Loader: class {
        constructor(loads) {
            this.length = 0;
            this.loaded = 0;
            this.loads = loads;
            this.request = null;

            for (let load of loads) this.length += load.length;

            this.PCPL = 100 / this.length;




            this.update = () => {
                CONTEXT.clearRect(0, 0, sWidth, sHeight)

                const values = []
                this.loaded = sum(...this.loads.map(load => load.loaded));



                CONTEXT.fillText((this.loaded * this.PCPL).toFixed(2) + "%", sWidth / 2, sHeight / 2)

                this.request = requestAnimationFrame(this.update);
            }
        }
        start() {
            this.request = requestAnimationFrame(this.update);
        }
        end() {
            cancelAnimationFrame(this.request)
        }
        static async loadFont(name, url) {
            const font = new FontFace(name, `url(${url})`);
            await font.load();
            document.fonts.add(font)
        }
        async load() {
            const toLoad = [];
            for (let load of this.loads) toLoad.push(load.load())
            this.start();
            await Promise.all(toLoad);
            await sleep(1000);
            this.end();
        }
    },
    Audio: class {
        constructor(json) {
            this.json = json;
            this.urls = [];
            this.names = [];
            this.length = 0;
            this.server = json.server;
            this.loaded = 0;
            for (let i in json.toLoad) {
                this.urls.push(json.toLoad[i]);
                this.names.push(i);
                this.length++;
            }
            this.loaded = 0;
        }
        play(name, startTime = 0) {
            try {
                const sound = {};
                Object.assign(sound, this.__proto__)

                sound[name].currentTime = startTime;

                sound[name].play();
            } catch (e) {
                console.log(`"${name}" doesn't exist`);
            }

        }
        async transition(song1, song2, max2, duration = 50) {
            const
                a1 = audio[song1],
                a2 = audio[song2],
                volume = 0.01;

            a2.volume = 0;

            a2.play();
            while (a1.volume >= 0.01) {

                a1.volume -= a1.volume - volume > 0 ? volume : 0

                a2.volume + volume < 1 ? a2.volume += volume : a1.volume = 0;

                a2.volume >= max2 ? a2.volume = max2 : 0;

                await sleep(duration);
            }
            a2.volume = max2;
            a1.pause()
        }
        async loadAudio(url) {
            return new Promise(resolve => {
                const audio = new Audio();
                audio.oncanplay = () => {
                    resolve(audio)
                }
                audio.src = this.server + url;
            })
        }
        async load() {
            const loads = []
            for (let i = 0; i < this.length; i++) {
                const url = this.urls[i];
                loads.push(this.loadAudio(url))
            }
            const loaded = await Promise.all(loads);
            for (let i in loaded) {
                this.loaded++;
                this.__proto__[this.names[i]] = loaded[i];
            }

        }
    },
    Graphics: class {
        constructor(json) {
            this.json = json;
            this.urls = [];
            this.names = [];
            this.length = 0;
            this.server = json.server;
            this.context = json.context;
            for (let i in json.toLoad) {
                this.urls.push(json.toLoad[i]);
                this.names.push(i);
                this.length++;
            }
            this.buffer = new Map();
            this.loaded = 0;

        }
        async loadImage(url) {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    resolve(img);
                }
                img.src = this.server + url;
            })
        }

        async load() {
            const loads = [];
            for (let i = 0; i < this.length; i++) {
                const url = this.urls[i];
                loads.push(this.loadImage(url))

            }
            const loaded = await Promise.all(loads);
            for (let i in loaded) {
                this.loaded++;
                this.__proto__[this.names[i]] = loaded[i];
            }
        }

        drawImage(name, x, y, w, h) {
            if (w && h) {
                this.context.drawImage(this[name], x, y, w, h);
            } else if (w) {
                this.context.drawImage(this[name], x, y, w, this[name].height);
            } else {
                this.context.drawImage(this[name], x, y);
            }
        }

        toSpriteSheet(name) {
            if (this[name]) {
                this.__proto__[name + "_spr"] = new SpriteSheet(this[name], this.context);

            }
        }
    },
}
function getBase64Image(img) {
    const buffer = document.createElement("canvas");
    buffer.width = img.width;
    buffer.height = img.height;
    buffer.getContext("2d").drawImage(img, 0, 0);
    return buffer.toDataURL();
}
function degToRoad(degree) {
    const factor = Math.PI / 180;
    return (factor * degree);
}
const random = (min, max, fix = 0) => Number((Math.random() * (max - min) + min).toFixed(fix))
class Timer {
    constructor(timeout, handleEvent, repeat = true) {
        this.handleEvent = handleEvent;
        this.timeout = timeout;
        this.currentTime = 0;
        this.waiting = false;
        this.request = null;
        this.repeat = repeat;
        this.update = () => {
            this.currentTime += dt;
            if (this.waiting) return;
            if (this.currentTime >= this.timeout) {
                this.currentTime = 0;
                this.handleEvent();
                if (!this.repeat) {
                    this.stop()
                    return;
                }


            }
            this.request = requestAnimationFrame(this.update);
        }
    }
    start() {
        this.request = requestAnimationFrame(this.update);
        this.currentTime = 0;
    }
    continue() {
        this.request = requestAnimationFrame(this.update);
    }
    stop() {
        cancelAnimationFrame(this.request);
        this.request = null;
    }
    async await(mls) {
        this.waiting = true;
        await sleep(mls);
        this.waiting = false;
    }
}
class RenderLoop {
    constructor(callback, minusFPS) {
        this.callback = callback;
        this.lt = 0;
        this.MFPS = minusFPS;
        this.update = ms => {
            dt = ms - this.lt;
            if (ms) if (this.MFPS) update(dt);
            this.lt = ms;
            requestAnimationFrame(this.update);
        }
    }
    start() {
        this.update(0);
    }

}
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}
class BoundingBox {
    constructor(x = 0, y = 0, w, h) {
        this.pos = new Vector(x, y);
        this.size = new Vector(w, h);
        this.box = {
            size: null,
            margin: null
        }
    }
    defineBox(x, y, w, h) {
        this.box.margin = new Vector(x, y)
        this.box.size = new Vector(w, h)
    }
    defaultBox() {
        this.box.margin = new Vector;
        this.box.size = new Vector(this.size.x, this.size.y);
    }
    drawBox() {
        CONTEXT.strokeStyle = "#f00"
        CONTEXT.lineWidth = 2;
        CONTEXT.beginPath()
        CONTEXT.rect(this.left + this.box.margin.x, this.top + this.box.margin.y,
            this.box.size.x, this.box.size.y)
        CONTEXT.stroke();
    }
    get top() { return this.pos.y }
    get left() { return this.pos.x }
    get right() { return this.pos.x + this.size.x }
    get bottom() { return this.pos.y + this.size.y }

    get width() { return this.size.x }
    get height() { return this.size.y }

    set width(width) { this.size.x = width }
    set height(height) { this.size.y = height }

    set x(x) { this.pos.x = x }
    set y(y) { this.pos.y = y }

    get x() { return this.pos.x }
    get y() { return this.pos.y }

    set top(value) { this.pos.y = value }
    set left(value) { this.pos.x = value }
    set right(value) { this.pos.x = value - this.size.x }
    set bottom(value) { this.pos.y = value - this.size.y }

    aabb(target) {
        return target.right - target.box.margin.x > this.left + this.box.margin.x &&
            target.left + target.box.margin.x < this.right - this.box.margin.x &&
            target.bottom - target.box.margin.y > this.top + this.box.margin.y &&
            target.top + target.box.margin.y < this.bottom - this.box.margin.y
    }
}
class Subject extends BoundingBox {
    constructor(x = 0, y = 0, w, h) {
        super(x, y, w, h);

        this.originLife;
        this.life;

        this.currentFrame = 0;
        this.distance = 0;
        this.velocity = null;

        this.defaultBox();

    }
    isOutBottomScreen() {
        return this.top >= sHeight;
    }
    isOutTopScreen() {
        return this.bottom < 0;
    }
    isOutLeftScreen() {
        return this.left <= 0;
    }
    isOutRightScreen() {
        return this.right - this.box.margin.x >= sWidth;
    }
    gravity() {
        this.velocity.y += gravity * dt;
        if (this.velocity.y > 0.4) this.velocity.y = 0.4;
        this.y += this.velocity.y * dt;
    }
    autoMoveX() {
        this.x += this.velocity.x * dt;
        if (this.isOutLeftScreen()) {
            this.left = 0;
            this.velocity.x = -this.velocity.x;
        } else if (this.isOutRightScreen()) {
            this.right = sWidth;
            this.velocity.x = -this.velocity.x;
        }
    }
    setVelocity(x, y) {
        this.velocity = new Vector(x, y);
    }

    lifeBar(x, y, w, h) {
        if (this.originLife == this.life) return;
        let width = w / this.originLife,
            widthBar = this.life * width,
            color = "";

        if (this.life <= this.originLife && this.life > this.originLife * 0.75) {
            color = "#89ff00"
        } else if (this.life <= this.originLife * 0.75 && this.life > this.originLife * 0.50) {
            color = "#ffee1f"
        } else if (this.life <= this.originLife * 0.50 && this.life > this.originLife * 0.25) {
            color = "#ff9b1f";
        } else if (this.life <= this.originLife * 0.25) {
            color = "#ff1f1f";
        }


        CONTEXT.fillStyle = color;
        CONTEXT.fillRect(x, y, widthBar, h);
        CONTEXT.strokeStyle = "#000"
        CONTEXT.beginPath();
        CONTEXT.lineWidth = "2";
        CONTEXT.rect(x, y, w, h)
        CONTEXT.stroke();
    }
    setLife(value) {
        this.originLife = value;
        this.life = value;
    }
    animate() {
        this.distance += dt * this.speedAnimate;
        this.currentFrame = Math.round((this.distance / 10) % this.totalFrames);
    }
    update() { }

}
class Bullet extends Subject {
    constructor(type, x, y, velY) {
        super(x, y, 16, 32)
        this.vel = new Vector(0, velY);
        this.damage = 10 + Math.abs(velY * 2);
        this.defineBox(5, 0, 7, 16)
    }
    update() {
        //  this.drawBox();
        this.y += this.vel.y * dt;
        graphics.drawImage("red_lazer", this.x, this.y, this.width, this.height)
    }
}
class Particle {
    constructor(color, x, y) {
        const colors = ["#f00", "#000", color]
        this.scale = 1.0;
        this.x = x;
        this.y = y;
        this.radius = random(5, 10);
        this.color = colors[random(0, colors.length - 1)];
        this.vel = new Vector(random(-0.3, 0.3, 3), random(-0.3, 0.3, 3));
        this.scaleSpeed = random(0.002, 0.005, 3);

    }
    update() {
        this.scale -= this.scaleSpeed * dt;
        if (this.scale <= 0) this.scale = 0;

        this.x += this.vel.x * dt;
        this.y += this.vel.y * dt;

        CONTEXT.save()
        CONTEXT.translate(this.x, this.y);
        CONTEXT.scale(this.scale, this.scale);
        CONTEXT.beginPath();
        CONTEXT.arc(0, 0, this.radius, 0, Math.PI * 2, true);
        CONTEXT.closePath();
        CONTEXT.fillStyle = this.color;
        CONTEXT.fill();
        CONTEXT.restore();

        return this.scale == 0 ? true : false;
    }

}
class Item extends Subject {
    constructor(spr, target, w = 32, h = 32, vx = 0, ongrab) {
        super(target.x + (target.width / 2), target.y + (target.height / 2), w, h);

        this.ongrab = ongrab;
        this.speedAnimate = 0.1;
        this.frames = graphics[spr + "_spr"].frame;
        this.totalFrames = this.frames.length - 1;
        this.sprName = spr + "_spr";
        this.setVelocity(vx, random(-1.2, -0.6, 3))
    }
    update() {
        this.animate();
        this.gravity();
        // this.drawBox();
        this.x += dt * this.velocity.x;
        graphics[this.sprName].drawFrame(this.currentFrame, this.x, this.y, this.width, this.height);

        if (this.aabb(game.player)) {
            Item[this.ongrab.name](...this.ongrab.arg);
            return true;
        }
    }
    static addCoins(target, value) {
        target.coins += value;
        audio.play("coin", 0);
    };

    static async setBulletVelocitySpawn(target, value, duration) {
        if (target.bulletSpaws.timeout - value < 0) return;
        target.bulletSpaws.timeout -= value;

        const timer = new Timer(duration, () => {
            target.bulletSpaws.timeout += value

        }, false)
        timer.start();
    }
    static async bulletVelocity(target, value, duration) {
        if (target.bulletVelocity > 2) return;
        target.bulletVelocity -= value;

        const timer = new Timer(duration, () => {
            target.bulletVelocity += value

        }, false)
        timer.start();
    }
}
class BulletCollision {
    constructor(enemy, bullet) {
        this.particles = new Set;
        for (let angle = 0; angle < 360; angle += Math.round(360 / 32)) {
            const speed = random(0.01, 0.05)
            this.particles.add(new Particle(enemy.enemy.color, bullet.x + 10, bullet.top - 10))
        }
    }

    update() {
        this.particles.forEach(particle => {

            if (particle.update()) this.particles.delete(particle)
        })
        return this.particles.size == 0 ? true : false;
    }
}
class DeadEnemyEffect extends Subject {
    constructor(score, x, y) {
        super(x, y, 50, 100);
        this.totalFrames = graphics.deadEnemyEffect_spr.frame.length - 1;
        this.currentFrame = 0;
        this.speedAnimate = 0.2;
        this.score = score;
        this.yScore = this.y;
        this.char = score < 0 ? '-' : '+';
        this.color = this.score < 0 ? "#f00" : "#fff";
        this.score = Math.abs(this.score)
    }
    update() {
        this.y += dt * 0.04;
        this.yScore -= dt * 0.04;
        this.animate();
        CONTEXT.font = "20px font-1"
        CONTEXT.fillStyle = this.color;
        CONTEXT.fillText(this.char + this.score, this.x, this.yScore);
        graphics.deadEnemyEffect_spr.drawFrame(this.currentFrame, this.x, this.y, this.width, this.height);

        return this.totalFrames == this.currentFrame;
    }
}
class HitEffect {
    constructor(hit, x, y) {
        this.hit = hit;

        this.x = x;
        if (x + 50 > sWidth) this.x -= 50;


        this.y = y;
        this.size = 20;
        this.blurSpeed = 0;
        this.blur = 0;
        this.color = "#fff";
        this.time = 0;
        this.rotate = random(-0.8, 0.8, 3);
    }
    update() {
        this.blur += this.blurSpeed * dt;
        if (this.blur >= 20) this.blur = 20;
        this.time += dt;
        if (this.time > 1100) this.blurSpeed = 0.01;


        CONTEXT.save()

        CONTEXT.translate(this.x, this.y);
        CONTEXT.rotate(this.rotate)
        CONTEXT.filter = `blur(${this.blur}px)`
        CONTEXT.fillStyle = this.color;
        CONTEXT.font = "20px font-1";
        CONTEXT.fillText(this.hit + " Hits", 0, 0);
        CONTEXT.restore();

        return this.blur == 20 ? true : false;
    }
}
class Player extends Subject {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.setLife(1000);
        this.defineBox(45, 40, 110, 30)
        this.bullets = new Set;
        this.score = 0;
        this.bulletVelocity = -0.5;
        this.bulletSpaws = new Timer(150, () => {
            this.bullets.add(new Bullet(0, (this.x + this.width / 2) - 8, this.top, this.bulletVelocity))
        })
        this.bulletSpaws.start();

        this.booster = new Map;

        this.frames = graphics.ship1_spr.frame;
        this.totalFrames = this.frames.length - 1;
        this.speedAnimate = 0.1;
        this.hits = 0;
        this.lastTimeKill = 0;
    }
    update() {
        //  this.drawBox()
        graphics.ship1_spr.drawFrame(this.currentFrame, this.x, this.y, this.width, this.height);

        this.booster.forEach(booster => {
            booster.update();
        })

        this.lastTimeKill += dt;
        if (this.lastTimeKill >= 1000) this.hits = 0;

        this.animate()
        this.bullets.forEach((bullet, bi) => {
            bullet.update()
            if (bullet.isOutTopScreen()) {
                this.bullets.delete(bullet);
                return;
            }
            game.enemies.forEach(enemy => {
                if (bullet.aabb(enemy)) {
                    const effect = new BulletCollision(enemy, bullet);

                    effects.add(effect);

                    if (enemy.killLife(bullet.damage)) {
                        game.enemies.delete(enemy);
                        //hits
                        if (this.lastTimeKill < 1000 || this.hits == 0) {
                            this.hits++;
                            this.lastTimeKill = 0;
                            if (this.hits > 1) {
                                effects.add(new HitEffect(this.hits, enemy.x, enemy.y));
                                let audioHit = this.hits - 1;
                                if (audioHit > 5) audioHit = 5;
                                audio.play(`hit${audioHit}`, 0)
                            }
                        }
                        const multScore = this.hits ? this.hits : 1;
                        this.score += enemy.enemy.score * multScore;
                        effects.add(new DeadEnemyEffect(enemy.enemy.score * multScore, enemy.x, enemy.y - 32));
                        for (let i = 0; i < random(1, 3); i++) {
                            itemsDroped.add(
                                new Item("coin", enemy, 24, 24, random(-0.05, 0.05, 3), { name: "addCoins", arg: [game, 1] }
                                ))
                        }

                        if (random(0, 100) > 90) {
                            const item = new Item("bulletVelocitySpawn", enemy, 32, 32, 0,
                                { name: "setBulletVelocitySpawn", arg: [player, 50, 5000] })

                            itemsDroped.add(item);
                        }
                        if (random(0, 100) < 50) {
                            const item = new Item("bulletVelocity", enemy, 32, 32, 0,
                                { name: "bulletVelocity", arg: [player, 0.3, 5000] })

                            itemsDroped.add(item);
                        }
                        audio.play("boom", 0)


                    }
                    this.bullets.delete(bullet)
                    return;
                }
            })

        });
        //draw life
        graphics.drawImage("life", 10, 10)
        CONTEXT.strokeStyle = "#f00";
        CONTEXT.lineWidth = 4;

        CONTEXT.beginPath()
        CONTEXT.arc(42, 41, 30, degToRoad(270), degToRoad((this.life - this.originLife) * (360 / this.originLife) - 90))
        CONTEXT.stroke();

        CONTEXT.fillStyle = "#fff";
        CONTEXT.fillText("score: " + this.score, 10, 100)
    }
}
class Enemy extends Subject {
    constructor(x, y) {
        const level = levels[game.playingLevel];

        super(x, y, level.eWidth, level.eHeight);


        this.enemy = level.enemies[random(0, level.enemies.length - 1)];
        this.setLife(this.enemy.life);
        this.defineBox(...this.enemy.margin, ...this.enemy.size)

        this.frames = graphics[`${this.enemy.name}_spr`].frame;
        this.totalFrames = this.frames.length - 1;


        this.setVelocity(0, 0.08)
        this.speedAnimate = 0.05;
        this.bullets = new Set
        this.damage = this.enemy.damage;

    }
    killLife(value) {
        this.life -= value;
        return this.life <= 0 ? true : false;
    }
    update() {
        this.y += dt * this.velocity.y;


        //this.drawBox();

        this.animate();
        this.autoMoveX();



        this.lifeBar(this.x + 16, this.y, 32, 8)
        graphics[`${this.enemy.name}_spr`].drawFrame(this.currentFrame, this.x, this.y, this.width, this.height);
    }
}
class Game extends RenderLoop {
    constructor(callback, player) {
        super(callback, 10)
        this.coins = 0;
        this.enemies = new Set;
        this.spawnEnemies = null;
        this.playingLevel = null;
        this.player = player;


    }
    continue() { }
    async play(levelName) {
        this.playingLevel = levelName;
        const level = levels[levelName];

        this.spawnEnemies = new Timer(10000, () => {
            for (let i = 0; i < sWidth; i += level.eWidth) {
                this.enemies.add(new Enemy(i, -64));
            }
        })
        this.spawnEnemies4x = new Timer(3000, () => {
            const enemy = new Enemy(random(0, sWidth - 50), -32)
            enemy.setVelocity(random(-0.06, 0.08, 3), random(0.06, 0.08, 3))
            this.enemies.add(enemy);
        })
        this.spawnEnemies4x.start()
        this.spawnEnemies.start();
        audio.play(levels[levelName].audioBG);
    }
    pause() {
        console.log("pause")
    }
    updateLevel() {
        this.enemies.forEach(enemy => {
            if (enemy.update() || enemy.isOutBottomScreen()) this.enemies.delete(enemy)
            if (enemy.aabb(player)) {
                player.life -= enemy.damage;

                effects.add(new DeadEnemyEffect(-enemy.damage, enemy.x, enemy.y - 32));
                this.enemies.delete(enemy);
                audio.play("playerEnemyColl", 0)
            }
        })

        this.player.update();

    }

}
function isMobile() {
    return (navigator.userAgent.match(/Android/i)) ||
        (navigator.userAgent.match(/webOS/i)) ||
        (navigator.userAgent.match(/iPhone/i)) ||
        (navigator.userAgent.match(/iPod/i)) ||
        (navigator.userAgent.match(/iPad/i)) ||
        (navigator.userAgent.match(/BlackBerry/i));
}
let lastX = 0;
let mousedown = false;

function movePlayer(x) {
    if (lastX > x) { //left   

        player.x -= lastX - x

    } else if (lastX < x) {//right
        player.x += x - lastX

    }

    if (player.x + player.width / 2 < 0) {
        player.x = -player.width / 2;

    } else if (player.x + player.width / 2 > sWidth) {
        player.x = -player.width / 2 + sWidth;

    }
}
function controlls() {
    if (isMobile()) {
        SCREEN.ontouchstart = e => {
            const touch = e.touches[0];
            lastX = touch.clientX;
        }
        SCREEN.ontouchmove = e => {
            const currentX = e.touches[0].clientX;
            movePlayer(currentX);
            lastX = currentX;
        }
    } else {
        SCREEN.onmousedown = e => {
            lastX = e.clientX;
            mousedown = true;
        }
        SCREEN.onmouseup = () => mousedown = false;
        SCREEN.onmousemove = e => {
            if (!mousedown) return;
            const currentX = e.clientX;
            movePlayer(currentX);
            lastX = currentX;
        }
    }

}
let
    SCREEN = null,
    CONTEXT = null,
    LOADER = null,
    audio = null,
    graphics = null,
    loop = null,
    dt = 0,
    stars = [],
    sWidth = innerWidth,
    sHeight = innerHeight,
    game = null,
    player = null,
    effects = new Set,
    itemsDroped = new Set;

let y = sHeight;
async function update(dt) {
    CONTEXT.clearRect(0, 0, sWidth, sHeight)

    y += dt * 0.01;

    graphics.drawImage("bg1", 0, -2026 + y, sWidth, graphics.bg1.height + sWidth * 0.8)

    game.updateLevel();

    itemsDroped.forEach(item => {
        if (item.update() || item.isOutBottomScreen()) itemsDroped.delete(item);
    })
    effects.forEach(effect => { if (effect.update()) effects.delete(effect) });

    CONTEXT.font = "20px sans-serif";
    CONTEXT.fillStyle = "#fff"

    CONTEXT.fillText(game.coins, sWidth - 32, 37)
    graphics.drawImage("money", sWidth - 64, 5, 32, 32)
}

async function main() {
    $("#info").innerHTML = "LOADING...";

    game = new Game(update);

    SCREEN = $("#game-screen");
    SCREEN.width = sWidth;
    SCREEN.height = sHeight;

    CONTEXT = SCREEN.getContext("2d");

    CONTEXT.fillStyle = "#fff"
    CONTEXT.font = "20px sans-serif";

    await Engine.Loader.loadFont("font-1", "./font-3.ttf");
    await Engine.Loader.loadFont("font-2", "./font-2.ttf");
    await Engine.Loader.loadFont("font-3", "./font-1.ttf");

    graphics = new Engine.Graphics({
        toLoad: {
            "enemy-1": "enemy1.png",
            "enemy-2": "space-invaders (20).png",
            "bg1": "Darkfire_Volcanos_Background.jpg",
            "deadEnemyEffect": "explosion.png",
            "red_lazer": "red_lazer.png",
            "ship1": "ship-1.png",
            "coin": "coin.png",
            "bulletVelocitySpawn": "bullet.png",
            "money": "money.png",
            "star": "star.png",
            "life": "life.png",
            "bulletVelocity": "bullet velocity.png"
        },
        server: "./media/",
        context: CONTEXT

    });

    audio = new Engine.Audio({
        toLoad: {
            bg1: "Dillon_Francis__Kill_The_Noise_-_Dill_The_Noise.mp3",
            coin: "coin.mp3",
            boom: "boom.mp3",
            hit1: "hit1.mp3",
            hit2: "hit2.mp3",
            hit3: "hit3.mp3",
            hit4: "hit4.mp3",
            hit5: "hit5.mp3",
            playerEnemyColl: "playerEnemyColl.mp3"
        },
        server: "./media/bgsong/"


    });

    LOADER = new Engine.Loader([audio, graphics]);

    await LOADER.load();

    audio.bg1.volume = 0.5;
    audio.boom.volume = 0.5;


    graphics.toSpriteSheet("enemy-1");
    graphics["enemy-1_spr"].defineSprite([[1, 0, 0, 96, 96], [2, 1, 0, 96, 96], [3, 2, 0, 96, 96], [4, 3, 0, 96, 96]])

    graphics.toSpriteSheet("enemy-2");
    graphics["enemy-2_spr"].defineSprite([[1, 0, 0, 512, 512], [1, 0, 0, 512, 512], [1, 0, 0, 512, 512], [1, 0, 0, 512, 512]])

    graphics.toSpriteSheet("deadEnemyEffect");
    const spr = []
    for (let i = 0; i < 21; i++) {
        spr.push([i + 1, i, 0, 50, 100]);
    }
    graphics.deadEnemyEffect_spr.defineSprite(spr)

    graphics.toSpriteSheet("ship1");
    graphics.ship1_spr.defineSprite([[1, 0, 0, 823, 558], [1, 1, 0, 823, 558], [1, 2, 0, 823, 558], [1, 3, 0, 823, 558]])

    graphics.toSpriteSheet("coin");
    graphics.coin_spr.defineSprite([[1, 0, 0, 16, 16], [2, 1, 0, 16, 16], [3, 2, 0, 16, 16], [4, 3, 0, 16, 16]])

    graphics.toSpriteSheet("bulletVelocitySpawn");
    graphics.bulletVelocitySpawn_spr.defineSprite([[1, 0, 0, 128, 128], [2, 0, 0, 128, 128], [3, 0, 0, 128, 128], [4, 0, 0, 128, 128]])

    graphics.toSpriteSheet("bulletVelocity");
    graphics.bulletVelocity_spr.defineSprite([[1, 0, 0, 256, 256], [2, 0, 0, 256, 256], [3, 0, 0, 256, 256], [4, 0, 0, 256, 256]])

    player = new Player(sWidth / 2.5, sHeight - 120, 200, 120);
    game.player = player;

    game.start();
    game.play("level1")
    controlls();

    $("#info").remove();

}

window.addEventListener("click", main);
