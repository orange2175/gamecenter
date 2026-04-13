window.GameData = (() => {
  const imageNames = [
    "st",

    "yuka1",
    "yuka2",
    "yuka3",

    "ir",
    "il",

    "r1",
    "r2",

    "rl1",
    "rl2",

    "pr",
    "pl",

    "kr",
    "kl",

    "dmr",
    "dml",

    "utudm1",
    "utudm2",

    "idr",
    "idl",

    "ded",

    "neba1",
    "neba2",

    "piyo1",
    "piyo2",

    "utu",

    "kar",
    "kal",
    "kbr",
    "kbl",
    "kcr",
    "kcl",

    "kd-a1",
    "kd-a2",
    "kd-b1",
    "kd-b2",
    "kd-d1",
    "kd-d2"
  ];

  const imgs = {};
  const imgState = {};

  const keys = {
    left: false,
    right: false
  };

  const player = {
    x: 120,
    y: 0,
    w: 120,
    h: 120,

    dir: "r",
    action: "idle",
    timer: 0,

    speed: 4,

    hp: 5,
    maxHp: 5,

    jumpPower: 13,
    vy: 0,
    onGround: false,

    invincible: 0,

    slimeMash: 0,
    slimeNeed: 8,
    lastMashDir: "",

    comboStep: 0,
    comboTimer: 0,

    score: 0,
    lastMoveDir: "r",

    attachedSpider: "",
    attachedSpiderDir: "r"
  };

  const world = {
    width: 5600,
    groundY: 0,
    cameraX: 0,
    shake: 0,
    shakeX: 0,
    hitStop: 0
  };

  const bindTraps = [
    {
      x: 900,
      y: 0,
      w: 110,
      h: 90,
      active: true,
      yOffset: 42,
      hitInsetX: 60,
      hitInsetTop: 45,
      hitH: 49
    },
    {
      x: 3180,
      y: 0,
      w: 110,
      h: 90,
      active: true,
      yOffset: 42,
      hitInsetX: 60,
      hitInsetTop: 45,
      hitH: 49
    }
  ];

  const slimeTraps = [
    { x: 1280, y: 0, w: 110, h: 18, active: true },
    { x: 1660, y: 0, w: 110, h: 18, active: true },
    { x: 2140, y: 0, w: 110, h: 18, active: true },
    { x: 3650, y: 0, w: 110, h: 18, active: true }
  ];

  const enemies = [
    { x: 980,  y: 0, w: 90,  h: 110, alive: true, speed: 1.0,  hitCooldown: 0, kind: "normal",  hp: 3, maxHp: 3, knockback: 0, knockDir: 1, flash: 0 },
    { x: 1320, y: 0, w: 86,  h: 106, alive: true, speed: 1.5,  hitCooldown: 0, kind: "fast",    hp: 5, maxHp: 5, knockback: 0, knockDir: 1, flash: 0 },
    { x: 1760, y: 0, w: 92,  h: 112, alive: true, speed: 0.95, hitCooldown: 0, kind: "confuse", hp: 7, maxHp: 7, knockback: 0, knockDir: 1, flash: 0 },
    { x: 2260, y: 0, w: 90,  h: 110, alive: true, speed: 1.15, hitCooldown: 0, kind: "normal",  hp: 3, maxHp: 3, knockback: 0, knockDir: 1, flash: 0 },
    { x: 2740, y: 0, w: 86,  h: 106, alive: true, speed: 1.7,  hitCooldown: 0, kind: "fast",    hp: 5, maxHp: 5, knockback: 0, knockDir: 1, flash: 0 },
    { x: 3260, y: 0, w: 92,  h: 112, alive: true, speed: 1.0,  hitCooldown: 0, kind: "confuse", hp: 7, maxHp: 7, knockback: 0, knockDir: 1, flash: 0 },
    { x: 3840, y: 0, w: 100, h: 118, alive: true, speed: 0.85, hitCooldown: 0, kind: "tank",    hp: 9, maxHp: 9, knockback: 0, knockDir: 1, flash: 0 },
    { x: 4320, y: 0, w: 86,  h: 106, alive: true, speed: 1.8,  hitCooldown: 0, kind: "fast",    hp: 5, maxHp: 5, knockback: 0, knockDir: 1, flash: 0 },
    { x: 4740, y: 0, w: 92,  h: 112, alive: true, speed: 1.0,  hitCooldown: 0, kind: "confuse", hp: 7, maxHp: 7, knockback: 0, knockDir: 1, flash: 0 },
    { x: 5160, y: 0, w: 100, h: 118, alive: true, speed: 0.9,  hitCooldown: 0, kind: "tank",    hp: 9, maxHp: 9, knockback: 0, knockDir: 1, flash: 0 }
  ];

  const goal = {
    x: 5420,
    y: 0,
    w: 34,
    h: 150
  };

  const stageProps = [];

  const TILE_W = 320;
  const TILE_H = 140;
  const TILE_SURFACE = 55;

  const stageTiles = [];

  for (let x = 0; x < world.width; x += TILE_W) {
    stageTiles.push({
      x,
      type: "yuka3",
      w: TILE_W,
      h: TILE_H,
      surface: TILE_SURFACE
    });
  }

  const items = [];
  const effects = [];

  let anim = 0;

  function overlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function setAction(action, time) {
    if (player.action === "dead") return;
    player.action = action;
    player.timer = time;
  }

  function currentSprite() {
    if (player.action === "dead") return "ded";
    if (player.action === "bind") return anim % 20 < 10 ? "utudm1" : "utudm2";
    if (player.action === "kda") return anim % 20 < 10 ? "kd-a1" : "kd-a2";
    if (player.action === "kdb") return anim % 20 < 10 ? "kd-b1" : "kd-b2";
    if (player.action === "kdd") return anim % 20 < 10 ? "kd-d1" : "kd-d2";
    if (player.action === "poison") return player.dir === "r" ? "idr" : "idl";
    if (player.action === "damage") return player.dir === "r" ? "dmr" : "dml";
    if (player.action === "slime") return anim % 20 < 10 ? "neba1" : "neba2";
    if (player.action === "confuse") return anim % 20 < 10 ? "piyo1" : "piyo2";
    if (player.action === "punch1" || player.action === "punch2") return player.dir === "r" ? "pr" : "pl";
    if (player.action === "kick") return player.dir === "r" ? "kr" : "kl";

    if (player.action === "run") {
      if (player.dir === "r") return anim % 20 < 10 ? "r1" : "r2";
      return anim % 20 < 10 ? "rl1" : "rl2";
    }

    return player.dir === "r" ? "ir" : "il";
  }

  function attackHitbox(type) {
    let range = 35;
    let power = 1;

    if (type === "punch2") {
      range = 84;
      power = 1;
    }

    if (type === "kick") {
      range = 112;
      power = 2;
    }

    return {
      x: player.dir === "r" ? player.x + player.w - 6 : player.x - range + 6,
      y: player.y + 24,
      w: range,
      h: player.h - 42,
      power
    };
  }

  function addDamageText(x, y, value, color = "#fff") {
    effects.push({
      type: "text",
      x,
      y,
      vy: -1.3,
      life: 34,
      text: String(value),
      color
    });
  }

  function addHitSpark(x, y) {
    effects.push({
      type: "spark",
      x,
      y,
      life: 12
    });
  }

  function addBreakBurst(x, y) {
    effects.push({
      type: "burst",
      x,
      y,
      life: 18
    });
  }

  function triggerHitStop(frames = 5) {
    world.hitStop = Math.max(world.hitStop, frames);
  }

  function triggerShake(power = 8) {
    world.shake = Math.max(world.shake, 10);
    world.shakeX = power;
  }

  function spawnHealItem(x, y) {
    items.push({
      type: "heal",
      x,
      y,
      w: 26,
      h: 26,
      vy: 0,
      active: true
    });
  }

  function maybeDropHeal(x, y, chance) {
    if (Math.random() < chance) {
      spawnHealItem(x, y);
    }
  }

  function healPlayer(amount = 1) {
    const old = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + amount);
    const healed = player.hp - old;

    if (healed > 0) {
      addDamageText(player.x + 40, player.y - 12, "+" + healed, "#7dff9c");
    }
  }

  function spiderDamage(actionName, color, spiderKey, spiderDir) {
    if (player.invincible > 0 || player.action === "dead") return;

    player.hp--;
    player.invincible = 180;
    setAction(actionName, 180);

    player.attachedSpider = spiderKey;
    player.attachedSpiderDir = spiderDir || "r";

    addDamageText(player.x + 50, player.y - 10, "-1", color || "#ffd3d3");
    triggerShake(8);

    if (player.hp <= 0) {
      player.hp = 0;
      player.action = "dead";
      player.timer = 999999;
    }
  }

  function damagePlayer() {
    if (player.invincible > 0 || player.action === "dead") return;

    player.hp--;
    player.invincible = 40;
    setAction("damage", 18);

    addDamageText(player.x + 50, player.y - 10, "-1", "#ffd3d3");
    triggerShake(7);

    if (player.hp <= 0) {
      player.hp = 0;
      player.action = "dead";
      player.timer = 999999;
    }
  }

  function confusePlayer() {
    if (player.invincible > 0 || player.action === "dead") return;

    player.hp--;
    player.invincible = 55;
    setAction("confuse", 90);

    addDamageText(player.x + 50, player.y - 10, "!?", "#ffe36b");
    triggerShake(8);

    if (player.hp <= 0) {
      player.hp = 0;
      player.action = "dead";
      player.timer = 999999;
    }
  }

  function hitEnemy(enemy, power) {
    enemy.hp -= power;
    enemy.knockback = power === 2 ? 24 : 15;
    enemy.knockDir = player.dir === "r" ? 1 : -1;
    enemy.hitCooldown = 18;
    enemy.flash = 8;

    addHitSpark(enemy.x + enemy.w / 2, enemy.y + 40);
    addDamageText(enemy.x + enemy.w / 2, enemy.y - 8, "-" + power, "#ffffff");

    triggerHitStop(power === 2 ? 6 : 4);
    triggerShake(power === 2 ? 10 : 6);

    if (enemy.hp <= 0) {
      enemy.alive = false;
      player.score += 100;
      addBreakBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
      maybeDropHeal(
        enemy.x + enemy.w / 2,
        enemy.y,
        enemy.kind === "tank" ? 0.55 : 0.25
      );
    }
  }

  return {
    imageNames,
    imgs,
    imgState,
    keys,
    player,
    world,
    bindTraps,
    slimeTraps,
    enemies,
    goal,
    stageProps,
    stageTiles,
    items,
    effects,
    get anim() { return anim; },
    set anim(v) { anim = v; },
    overlap,
    setAction,
    currentSprite,
    attackHitbox,
    spiderDamage,
    damagePlayer,
    confusePlayer,
    hitEnemy,
    addDamageText,
    addHitSpark,
    addBreakBurst,
    triggerHitStop,
    triggerShake,
    healPlayer
  };
})();
