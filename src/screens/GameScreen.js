import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { AsteroidGame } from '../game/AsteroidGame';

const { width: SW, height: SH } = Dimensions.get('window');

// Reserve space for HUD (top) and controls (bottom)
const HUD_HEIGHT = 44;
const CONTROLS_HEIGHT = 150;
const GAME_H = SH - HUD_HEIGHT - CONTROLS_HEIGHT;

// 80 static background stars — created once
const STARS = Array.from({ length: 80 }, () => ({
  x: Math.random() * SW,
  y: Math.random() * GAME_H,
}));

export function GameScreen() {
  const gameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const animRef = useRef(null);
  const controls = useRef({ left: false, right: false, up: false, down: false });

  // Snapshot of game state drives renders
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    gameRef.current = new AsteroidGame(SW, GAME_H);
    setSnap(gameRef.current.getSnapshot());
  }, []);

  const loop = useCallback((timestamp) => {
    if (!gameRef.current) return;
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    gameRef.current.update(dt, controls.current);
    setSnap(gameRef.current.getSnapshot());
    animRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [loop]);

  const handleStart = useCallback(() => {
    if (!gameRef.current) return;
    gameRef.current.start();
    lastTimeRef.current = null;
  }, []);

  const handleNewGame = useCallback(() => {
    if (!gameRef.current) return;
    gameRef.current.reset();
    gameRef.current.start();
    lastTimeRef.current = null;
  }, []);

  const handleFire = useCallback(() => {
    if (gameRef.current) gameRef.current.fireMissile();
  }, []);

  const handleJump = useCallback(() => {
    if (gameRef.current) gameRef.current.hyperJump();
  }, []);

  if (!snap) return null;

  const {
    ship, asteroids, missiles, enemyShips, spaceMines, garbage,
    score, lives, level, time, gameOver, gameStarted,
  } = snap;

  // Blink the ship during invincibility using wall-clock time
  const blink = snap.ship?.invincible && Math.floor(Date.now() / 150) % 2 === 0;

  return (
    <SafeAreaView style={styles.root}>
      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>Score {score}</Text>
        <Text style={styles.hudText}>Lv {level}</Text>
        <Text style={styles.hudText}>{'♥ '.repeat(Math.max(0, lives)).trim()}</Text>
        <Text style={styles.hudText}>{time}s</Text>
      </View>

      {/* Game canvas */}
      <View style={styles.canvas}>
        {/* Stars */}
        {STARS.map((s, i) => (
          <View key={i} style={[styles.star, { left: s.x, top: s.y }]} />
        ))}

        {/* Debris */}
        {garbage.map(g => (
          <View
            key={g.id}
            style={[styles.garbage, { left: g.x - 3, top: g.y - 3, opacity: Math.max(0, g.life) }]}
          />
        ))}

        {/* Space mines */}
        {spaceMines.map(mine => (
          <View
            key={mine.id}
            style={[styles.spaceMine, { left: mine.x - mine.radius, top: mine.y - mine.radius }]}
          />
        ))}

        {/* Asteroids — circles, 50 px diameter at full size */}
        {asteroids.map(a => (
          <View
            key={a.id}
            style={{
              position: 'absolute',
              left: a.x - a.radius,
              top: a.y - a.radius,
              width: a.radius * 2,
              height: a.radius * 2,
              borderRadius: a.radius,
              backgroundColor: 'rgb(150,255,64)',
              borderWidth: 1,
              borderColor: 'rgba(180,255,100,0.6)',
            }}
          />
        ))}

        {/* Missiles */}
        {missiles.map(m => (
          <View key={m.id} style={[styles.missile, { left: m.x - 3, top: m.y - 3 }]} />
        ))}

        {/* Enemy ships */}
        {enemyShips.map(e => (
          <View
            key={e.id}
            style={[
              styles.shipWrap,
              {
                left: e.x - e.radius,
                top: e.y - e.radius,
                width: e.radius * 2,
                height: e.radius * 2,
                transform: [{ rotate: `${e.heading}deg` }],
              },
            ]}
          >
            <View style={styles.enemyTriangle} />
          </View>
        ))}

        {/* Player ship */}
        {ship && !ship.destroyed && (
          <View
            style={[
              styles.shipWrap,
              {
                left: ship.x - 14,
                top: ship.y - 14,
                width: 28,
                height: 28,
                transform: [{ rotate: `${ship.heading}deg` }],
                opacity: blink ? 0.25 : 1,
              },
            ]}
          >
            <View style={styles.shipTriangle} />
          </View>
        )}

        {/* Start overlay */}
        {!gameStarted && !gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>ASTEROIDS</Text>
            <Text style={styles.overlaySub}>The Pink Viper</Text>
            <TouchableOpacity style={styles.bigBtn} onPress={handleStart}>
              <Text style={styles.bigBtnText}>TAP TO START</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game-over overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>GAME OVER</Text>
            <Text style={styles.overlaySub2}>Score: {score}</Text>
            <TouchableOpacity style={styles.bigBtn} onPress={handleNewGame}>
              <Text style={styles.bigBtnText}>NEW GAME</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      {gameStarted && !gameOver && (
        <View style={styles.controls}>
          {/* D-pad */}
          <View style={styles.dpad}>
            <View style={styles.dpadRow}>
              <View style={styles.dpadGap} />
              <Btn label="▲" onIn={() => (controls.current.up = true)} onOut={() => (controls.current.up = false)} />
              <View style={styles.dpadGap} />
            </View>
            <View style={styles.dpadRow}>
              <Btn label="◄" onIn={() => (controls.current.left = true)} onOut={() => (controls.current.left = false)} />
              <Btn label="▼" onIn={() => (controls.current.down = true)} onOut={() => (controls.current.down = false)} />
              <Btn label="►" onIn={() => (controls.current.right = true)} onOut={() => (controls.current.right = false)} />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable onPress={handleFire} style={styles.fireBtn}>
              <Text style={styles.fireBtnText}>FIRE</Text>
            </Pressable>
            <Pressable onPress={handleJump} style={styles.jumpBtn}>
              <Text style={styles.jumpBtnText}>JUMP</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// D-pad button — holds down while pressed
function Btn({ label, onIn, onOut }) {
  return (
    <Pressable
      onPressIn={onIn}
      onPressOut={onOut}
      style={({ pressed }) => [styles.dpadBtn, pressed && styles.dpadBtnActive]}
    >
      <Text style={styles.dpadBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // HUD
  hud: {
    height: HUD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0a0a0a',
    borderBottomColor: '#222',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  hudText: { color: '#ffa500', fontSize: 13, fontFamily: 'monospace' },

  // Game area
  canvas: {
    width: SW,
    height: GAME_H,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  // Background stars
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },

  // Missile
  missile: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgb(190,240,190)',
  },

  // Debris
  garbage: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff8c00',
  },

  // Space mine — square with glow border
  spaceMine: {
    position: 'absolute',
    width: 26,
    height: 26,
    backgroundColor: 'rgb(100,100,255)',
    borderColor: 'rgba(150,150,255,0.8)',
    borderWidth: 2,
    borderRadius: 3,
  },

  // Shared wrapper for rotatable ships
  shipWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Player ship triangle (apex up = heading 0)
  shipTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3399ff',
  },

  // Enemy ship triangle (pink)
  enemyTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 26,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgb(255,0,175)',
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayTitle: {
    color: '#ffa500',
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: 8,
  },
  overlaySub: { color: '#ff69b4', fontSize: 18, marginBottom: 32 },
  overlaySub2: { color: '#fff', fontSize: 26, marginBottom: 32 },
  bigBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffa500',
    backgroundColor: 'rgba(255,165,0,0.15)',
  },
  bigBtnText: { color: '#ffa500', fontSize: 20, fontWeight: 'bold', letterSpacing: 3 },

  // Controls panel
  controls: {
    height: CONTROLS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#080808',
    borderTopColor: '#222',
    borderTopWidth: 1,
  },
  dpad: { alignItems: 'center' },
  dpadRow: { flexDirection: 'row' },
  dpadGap: { width: 50, height: 50, margin: 3 },
  dpadBtn: {
    width: 50,
    height: 50,
    margin: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  dpadBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Action buttons
  actions: { gap: 12, alignItems: 'center' },
  fireBtn: {
    width: 78,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,50,50,0.25)',
    borderColor: 'rgba(255,80,80,0.6)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireBtnText: { color: '#ff5555', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  jumpBtn: {
    width: 78,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(50,80,255,0.25)',
    borderColor: 'rgba(80,100,255,0.6)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpBtnText: { color: '#8899ff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
});
