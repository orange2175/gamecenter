window.GameRender = (() => {
  const G = window.GameData;
  
  function drawFallback(ctx, name, x, y, w, h) {
    ctx.fillStyle = "#00d5ff";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText(name, x + 8, y + h / 2);
  }
  
  function drawHpBar(ctx, x, y, w, h, hp, maxHp, color) {
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, (hp / maxHp) * w), h);
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.strokeRect(x, y, w, h);
  }
  
  function drawPlayer(ctx) {
    const name = G.currentSprite();
    const screenX = G.player.x - G.world.cameraX;
    const drawY = G.player.y;
    
    if (G.imgState[name] === "ok" && G.imgs[name].complete) {
      ctx.globalAlpha =
        G.player.invincible > 0 && G.player.invincible % 6 < 3 ? 0.55 : 1;
      ctx.drawImage(G.imgs[name], screenX, drawY, G.player.w, G.player.h);
      ctx.globalAlpha = 1;
    } else {
      drawFallback(ctx, name, screenX, drawY, G.player.w, G.player.h);
    }
    
    drawHpBar(
      ctx,
      screenX + 10,
      drawY - 14,
      100,
      8,
      G.player.hp,
      G.player.maxHp,
      "#3ddc84"
    );
  }
  
  function getEnemySprite(enemy) {
    const faceRight = G.player.x >= enemy.x;
    
    if (enemy.kind === "fast") {
      return faceRight ? "kbr" : "kbl";
    }
    
    if (enemy.kind === "confuse" || enemy.kind === "tank") {
      return faceRight ? "kcr" : "kcl";
    }
    
    return faceRight ? "kar" : "kal";
  }
  
  function drawEnemy(ctx, enemy) {
    const x = enemy.x - G.world.cameraX;
    const y = enemy.y;
    const spriteName = getEnemySprite(enemy);
    
    if (G.imgState[spriteName] === "ok" && G.imgs[spriteName].complete) {
      if (enemy.flash > 0) {
        ctx.globalAlpha = 0.55;
      }
      ctx.drawImage(G.imgs[spriteName], x, y, enemy.w, enemy.h);
      ctx.globalAlpha = 1;
    } else {
      drawFallback(ctx, spriteName, x, y, enemy.w, enemy.h);
    }
    
    drawHpBar(
      ctx,
      x + 6,
      y - 10,
      enemy.w - 12,
      6,
      enemy.hp,
      enemy.maxHp,
      "#ff5252"
    );
  }
  
  function drawBackground(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (G.imgState["st"] === "ok" && G.imgs["st"].complete) {
      const bg = G.imgs["st"];
      const scale = canvas.height / bg.height;
      const drawW = bg.width * scale;
      const drawH = canvas.height;
      const offsetX = -(G.world.cameraX * 0.25) % drawW;
      
      for (let x = offsetX - drawW; x < canvas.width + drawW; x += drawW) {
        ctx.drawImage(bg, x, 0, drawW, drawH);
      }
    } else {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  function drawStageTiles(ctx) {
    G.stageTiles.forEach(tile => {
      const x = tile.x - G.world.cameraX;
      const y = G.world.groundY - tile.h;
      const img = G.imgs[tile.type];
      
      if (G.imgState[tile.type] === "ok" && img.complete) {
        ctx.drawImage(img, x, y, tile.w, tile.h);
      } else {
        ctx.fillStyle = "#666";
        ctx.fillRect(x, y, tile.w, tile.h);
      }
    });
  }
  
  function drawItems(ctx) {
    G.items.forEach(item => {
      if (!item.active) return;
      
      const x = item.x - G.world.cameraX;
      const y = item.y;
      
      if (item.type === "heal") {
        ctx.fillStyle = "#ff4f6d";
        ctx.fillRect(x + 8, y + 2, 10, 18);
        ctx.fillRect(x + 2, y + 8, 22, 10);
      }
    });
  }
  
  function drawBindTraps(ctx) {
    G.bindTraps.forEach(trap => {
      if (!trap.active) return;
      
      const x = trap.x - G.world.cameraX;
      const y = trap.y;
      const img = G.imgs["utu"];
      
      if (G.imgState["utu"] === "ok" && img.complete) {
        ctx.drawImage(img, x, y, trap.w, trap.h);
      } else {
        ctx.fillStyle = "#6f8a3d";
        ctx.fillRect(x, y, trap.w, trap.h);
      }
    });
  }
  
  function drawSlimeTraps(ctx) {
    G.slimeTraps.forEach(trap => {
      if (!trap.active) return;
      ctx.fillStyle = "#8b6a2b";
      ctx.fillRect(trap.x - G.world.cameraX, trap.y, trap.w, trap.h);
    });
  }
  
  function drawTraps(ctx) {
    drawBindTraps(ctx);
    drawSlimeTraps(ctx);
  }
  
  function drawGoal(ctx) {
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(G.goal.x - G.world.cameraX, G.goal.y, G.goal.w, G.goal.h);
  }
  
  function drawEffects(ctx) {
    G.effects.forEach(effect => {
      const x = effect.x - G.world.cameraX;
      
      if (effect.type === "text") {
        ctx.fillStyle = effect.color;
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(effect.text, x, effect.y);
      }
      
      if (effect.type === "spark") {
        ctx.strokeStyle = "#fff59a";
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const ang = (Math.PI * 2 / 4) * i + effect.life * 0.08;
          ctx.beginPath();
          ctx.moveTo(x, effect.y);
          ctx.lineTo(
            x + Math.cos(ang) * 14,
            effect.y + Math.sin(ang) * 14
          );
          ctx.stroke();
        }
      }
      
      if (effect.type === "burst") {
        ctx.fillStyle = "#ffcc80";
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 / 6) * i + effect.life * 0.1;
          ctx.fillRect(
            x + Math.cos(ang) * 16,
            effect.y + Math.sin(ang) * 16,
            4,
            4
          );
        }
      }
    });
  }
  
  function drawWorldUi(ctx, canvas) {
    drawHpBar(ctx, 14, 42, 140, 10, G.player.hp, G.player.maxHp, "#3ddc84");
    
    const progress = Math.min(1, G.player.x / G.goal.x);
    drawHpBar(ctx, canvas.width - 164, 18, 140, 8, progress, 1, "#ffd700");
    
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText("SCORE " + G.player.score, 14, 28);
    
    if (G.player.comboTimer > 0 && G.player.comboStep > 0) {
      ctx.fillStyle = "#fff59a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("COMBO " + G.player.comboStep, canvas.width / 2 - 42, 34);
    }
  }
  
  function render(ctx, canvas) {
    const shakeOffset =
      G.world.shake > 0 ?
      (G.world.shake % 2 === 0 ? -G.world.shakeX : G.world.shakeX) :
      0;
    
    ctx.save();
    ctx.translate(shakeOffset, 0);
    
    drawBackground(ctx, canvas);
    drawStageTiles(ctx);
    drawTraps(ctx);
    drawGoal(ctx);
    drawItems(ctx);
    
    G.enemies.forEach(enemy => {
      if (enemy.alive) drawEnemy(ctx, enemy);
    });
    
    drawPlayer(ctx);
    drawEffects(ctx);
    drawWorldUi(ctx, canvas);
    
    ctx.restore();
  }
  
  return { render };
})();

ーーー
無視して