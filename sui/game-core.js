const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const msg = document.getElementById("msg");

const G = window.GameData;
const R = window.GameRender;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 110;
}
window.addEventListener("resize", resize);
resize();

let loadedCount = 0;

function loadImages(done) {
  G.imageNames.forEach(name => {
    const img = new Image();

    img.onload = () => {
      G.imgState[name] = "ok";
      loadedCount++;
      if (loadedCount === G.imageNames.length) done();
    };

    img.onerror = () => {
      G.imgState[name] = "miss";
      loadedCount++;
      if (loadedCount === G.imageNames.length) done();
    };

    img.src = name + ".png";
    G.imgs[name] = img;
  });
}

function bindButton(id, onPress, onRelease) {
  const el = document.getElementById(id);

  const press = e => {
    e.preventDefault();
    onPress();
  };

  const release = e => {
    e.preventDefault();
    onRelease();
  };

  el.addEventListener("pointerdown", press, { passive: false });
  el.addEventListener("pointerup", release, { passive: false });
  el.addEventListener("pointercancel", release, { passive: false });
  el.addEventListener("pointerleave", release, { passive: false });
}

function updateEffects() {
  for (let i = G.effects.length - 1; i >= 0; i--) {
    const e = G.effects[i];
    e.life--;

    if (e.type === "text") e.y += e.vy;

    if (e.life <= 0) {
      G.effects.splice(i, 1);
    }
  }
}

function getFloorY() {
  const baseTile = G.stageTiles[0];
  if (!baseTile) return canvas.height - 85;
  return G.world.groundY - baseTile.h + baseTile.surface;
}

function updateItems() {
  const floorY = getFloorY();

  G.items.forEach(item => {
    if (!item.active) return;

    item.y += item.vy;

    if (item.y + item.h >= floorY) {
      item.y = floorY - item.h;
      item.vy = 0;
    } else {
      item.vy += 0.35;
    }

    const playerBody = {
      x: G.player.x + 22,
      y: G.player.y + 14,
      w: G.player.w - 44,
      h: G.player.h - 20
    };

    if (G.overlap(playerBody, item)) {
      item.active = false;

      if (item.type === "heal") {
        G.healPlayer(1);
        G.player.score += 25;
      }
    }
  });
}

function updateShakeAndHitstop() {
  if (G.world.shake > 0) G.world.shake--;

  if (G.world.hitStop > 0) {
    G.world.hitStop--;
    return true;
  }

  return false;
}

function getPlatforms() {
  return G.stageTiles.map(tile => ({
    x: tile.x,
    y: G.world.groundY - tile.h + tile.surface,
    w: tile.w,
    h: 20
  }));
}

function applyHorizontalMove() {
  const canMove =
    G.player.action === "idle" ||
    G.player.action === "run";

  if (!canMove) return;

  let dx = 0;
  let moved = false;

  if (G.keys.right) {
    dx += G.player.speed;
    G.player.dir = "r";
    G.player.lastMoveDir = "r";
    moved = true;
  }

  if (G.keys.left) {
    dx -= G.player.speed;
    G.player.dir = "l";
    G.player.lastMoveDir = "l";
    moved = true;
  }

  G.player.action = moved ? "run" : "idle";

  if (dx === 0) return;

  G.player.x = Math.max(
    0,
    Math.min(G.world.width - G.player.w, G.player.x + dx)
  );
}

function applyVerticalPhysics() {
  const prevBottom = G.player.y + G.player.h;

  if (!G.player.onGround) {
    G.player.vy += 0.68;
    G.player.y += G.player.vy;
  }

  const platforms = getPlatforms();
  let landed = false;

  for (const plat of platforms) {
    const feetLeft = G.player.x + 28;
    const feetRight = G.player.x + G.player.w - 28;
    const overlapsX = feetRight > plat.x && feetLeft < plat.x + plat.w;

    const nowBottom = G.player.y + G.player.h;
    const wasAbove = prevBottom <= plat.y + 2;
    const crossedTop = nowBottom >= plat.y && nowBottom <= plat.y + 24;

    if (G.player.vy >= 0 && overlapsX && wasAbove && crossedTop) {
      G.player.y = plat.y - G.player.h;
      G.player.vy = 0;
      G.player.onGround = true;
      landed = true;
      break;
    }
  }

  if (!landed) {
    G.player.onGround = false;
  }

  if (G.player.onGround) {
    const feetLeft = G.player.x + 28;
    const feetRight = G.player.x + G.player.w - 28;
    let stillOnPlatform = false;

    for (const plat of platforms) {
      const overlapsX = feetRight > plat.x && feetLeft < plat.x + plat.w;
      const touchingTop = Math.abs((G.player.y + G.player.h) - plat.y) <= 4;

      if (overlapsX && touchingTop) {
        G.player.y = plat.y - G.player.h;
        G.player.vy = 0;
        stillOnPlatform = true;
        break;
      }
    }

    if (!stillOnPlatform) {
      G.player.onGround = false;
    }
  }
}

function updatePlayer() {
  if (G.world.clear) return;

  G.anim++;
  G.world.groundY = canvas.height - 40;

  if (G.player.invincible > 0) G.player.invincible--;

  if (G.player.comboTimer > 0) {
    G.player.comboTimer--;
  } else {
    G.player.comboStep = 0;
  }

  if (G.player.timer > 0) {
    G.player.timer--;

    if (G.player.timer <= 0 && G.player.action !== "dead") {
      if (G.player.action === "slime") {
        G.player.slimeMash = 0;
        G.player.lastMashDir = "";
      }

      if (["kda", "kdb", "kdd"].includes(G.player.action)) {
        G.player.x = Math.max(0, G.player.x - 36);
        G.player.attachedSpider = "";
      }

      G.player.action = "idle";
    }
  }

  applyHorizontalMove();
  applyVerticalPhysics();

  const floorY = getFloorY();

  G.bindTraps.forEach(trap => {
    trap.y = floorY - trap.h + (trap.yOffset || 0);
  });

  G.slimeTraps.forEach(trap => {
    trap.y = floorY - trap.h;
  });

  G.goal.y = floorY - G.goal.h;
}

function updateBindTraps() {
  if (G.world.clear) return;

  for (const trap of G.bindTraps) {
    if (!trap.active) continue;
    if (G.player.action === "dead") continue;

    const playerFeet = {
      x: G.player.x + 38,
      y: G.player.y + G.player.h - 8,
      w: G.player.w - 76,
      h: 6
    };

    const trapHit = {
      x: trap.x + (trap.hitInsetX || 0),
      y: trap.y + (trap.hitInsetTop || 0),
      w: trap.w - ((trap.hitInsetX || 0) * 2),
      h: trap.hitH || trap.h
    };

    if (G.overlap(playerFeet, trapHit)) {
      trap.active = false;
      G.setAction("bind", 180);
      G.player.invincible = Math.max(G.player.invincible, 180);

      setTimeout(() => {
        if (G.player.action !== "dead" && !G.world.clear) {
          G.player.action = "idle";
          G.player.timer = 0;
        }
      }, 3000);
    }
  }
}

function updateSlimeTraps() {
  if (G.world.clear) return;

  for (const trap of G.slimeTraps) {
    if (!trap.active) continue;
    if (G.player.action === "dead") continue;

    const playerFeet = {
      x: G.player.x + 42,
      y: G.player.y + G.player.h - 6,
      w: G.player.w - 84,
      h: 5
    };

    if (G.overlap(playerFeet, trap)) {
      trap.active = false;
      G.player.action = "slime";
      G.player.timer = 999999;
      G.player.slimeMash = 0;
      G.player.lastMashDir = "";
    }
  }
}

function getSpiderHitAction(enemy) {
  if (enemy.kind === "normal") {
    return {
      action: "kda",
      color: "#dfe3ff",
      spiderKey: "ka"
    };
  }

  if (enemy.kind === "fast") {
    return {
      action: "kdb",
      color: "#d4ffd9",
      spiderKey: "kb"
    };
  }

  return {
    action: "kdd",
    color: "#f1d2ff",
    spiderKey: "kc"
  };
}

function updateEnemies() {
  if (G.world.clear) return;

  const floorY = getFloorY();

  G.enemies.forEach(enemy => {
    if (!enemy.alive) return;

    enemy.y = floorY - enemy.h;

    if (enemy.hitCooldown > 0) enemy.hitCooldown--;
    if (enemy.flash > 0) enemy.flash--;

    if (enemy.knockback > 0) {
      enemy.x += enemy.knockDir * 4;
      enemy.knockback--;
      return;
    }

    const dx = G.player.x - enemy.x;
    const chaseRange = enemy.kind === "fast" ? 500 : 430;

    if (!["kda", "kdb", "kdd", "bind"].includes(G.player.action)) {
      if (Math.abs(dx) < chaseRange && Math.abs(dx) > 18) {
        enemy.x += dx > 0 ? enemy.speed : -enemy.speed;
      }
    }

    const enemyBody = {
      x: enemy.x + 20,
      y: enemy.y + 18,
      w: enemy.w - 40,
      h: enemy.h - 24
    };

    const playerBody = {
      x: G.player.x + 30,
      y: G.player.y + 28,
      w: G.player.w - 60,
      h: G.player.h - 44
    };

    if (G.overlap(playerBody, enemyBody) && enemy.hitCooldown <= 0) {
      enemy.hitCooldown = 70;

      const spiderDir = G.player.x >= enemy.x ? "r" : "l";
      const hitInfo = getSpiderHitAction(enemy);

      G.spiderDamage(
        hitInfo.action,
        hitInfo.color,
        hitInfo.spiderKey,
        spiderDir
      );
    }
  });
}

function processAttacks() {
  if (!["punch1", "punch2", "kick"].includes(G.player.action)) return;

  const hitbox = G.attackHitbox(G.player.action);

  G.enemies.forEach(enemy => {
    if (!enemy.alive) return;

    const enemyBody = {
      x: enemy.x + 18,
      y: enemy.y + 22,
      w: enemy.w - 36,
      h: enemy.h - 30
    };

    if (G.overlap(hitbox, enemyBody) && enemy.hitCooldown <= 0) {
      G.hitEnemy(enemy, hitbox.power);
    }
  });
}

function updateCamera() {
  G.world.cameraX = Math.max(
    0,
    Math.min(
      G.world.width - canvas.width,
      G.player.x - canvas.width * 0.35
    )
  );
}

function updateClear() {
  if (G.player.x + G.player.w > G.goal.x && !G.world.clear) {
    G.world.clear = true;
    G.world.clearTimer = 180;
  }

  if (G.world.clear) {
    G.world.clearTimer--;

    if (G.world.clearTimer <= 0) {
      location.href = "gametop.html";
    }
  }
}

function updateMessage() {
  if (G.player.action === "dead") {
    msg.textContent = "GAME OVER";
    return;
  }

  if (G.world.clear) {
    msg.textContent = "CLEAR";
    return;
  }

  const aliveEnemies = G.enemies.filter(e => e.alive).length;
  const activeHeals = G.items.filter(i => i.active && i.type === "heal").length;

  if (G.player.action === "slime") {
    msg.textContent =
      `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score} ` +
      `ネバネバ:${G.player.slimeMash}/${G.player.slimeNeed}`;
    return;
  }

  if (G.player.action === "bind") {
    msg.textContent =
      `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score} 捕食中`;
    return;
  }

  if (G.player.action === "kda") {
    msg.textContent =
      `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score} 黒蜘蛛拘束`;
    return;
  }

  if (G.player.action === "kdb") {
    msg.textContent =
      `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score} 緑蜘蛛拘束`;
    return;
  }

  if (G.player.action === "kdd") {
    msg.textContent =
      `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score} 紫蜘蛛拘束`;
    return;
  }

  if (G.player.action === "confuse") {
    msg.textContent =
      `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score} 混乱中`;
    return;
  }

  msg.textContent =
    `HP:${G.player.hp} 敵:${aliveEnemies} 回復:${activeHeals} SCORE:${G.player.score}`;
}

function trySlimeMash(dir) {
  if (G.player.action !== "slime") return;
  if (G.player.lastMashDir === dir) return;

  G.player.lastMashDir = dir;
  G.player.slimeMash++;

  if (G.player.slimeMash >= G.player.slimeNeed) {
    G.player.slimeMash = 0;
    G.player.lastMashDir = "";
    G.player.action = "idle";
    G.player.timer = 0;
  }
}

function startPunchCombo() {
  if (G.world.clear) return;
  if (["dead", "bind", "confuse", "slime", "kda", "kdb", "kdd"].includes(G.player.action)) return;

  if (G.player.comboStep === 1 && G.player.comboTimer > 0) {
    G.player.comboStep = 2;
    G.player.comboTimer = 20;
    G.setAction("punch2", 12);
  } else {
    G.player.comboStep = 1;
    G.player.comboTimer = 20;
    G.setAction("punch1", 12);
  }
}

function startKick() {
  if (G.world.clear) return;
  if (["dead", "bind", "confuse", "slime", "kda", "kdb", "kdd"].includes(G.player.action)) return;

  G.player.comboStep = 3;
  G.player.comboTimer = 24;
  G.setAction("kick", 18);
}

function loop() {
  const stopped = updateShakeAndHitstop();

  updateEffects();

  if (!stopped) {
    updateItems();
    updatePlayer();
    updateBindTraps();
    updateSlimeTraps();
    updateEnemies();
    processAttacks();
    updateCamera();
    updateClear();
    updateMessage();
  }

  R.render(ctx, canvas);

  requestAnimationFrame(loop);
}

bindButton("left", () => {
  G.keys.left = true;
  trySlimeMash("l");
}, () => {
  G.keys.left = false;
});

bindButton("right", () => {
  G.keys.right = true;
  trySlimeMash("r");
}, () => {
  G.keys.right = false;
});

bindButton("punch", () => {
  startPunchCombo();
}, () => {});

bindButton("kick", () => {
  startKick();
}, () => {});

bindButton("jump", () => {
  if (G.world.clear) return;
  if (["dead", "bind", "confuse", "slime", "kda", "kdb", "kdd"].includes(G.player.action)) return;
  if (!G.player.onGround) return;

  G.player.onGround = false;
  G.player.vy = -G.player.jumpPower;
}, () => {});

loadImages(() => {
  loop();
});