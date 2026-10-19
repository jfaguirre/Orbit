// Test all audio fallback code
class MockParam {
  constructor(v = 0) { this.value = v; }
  setValueAtTime(v, t) { this.value = v; }
  exponentialRampToValueAtTime(v, t) {
    if (v <= 0) throw new Error("exponentialRampToValueAtTime target value must be non-zero and positive!");
    this.value = v;
  }
  linearRampToValueAtTime(v, t) { this.value = v; }
}

class MockNode {
  constructor() {
    this.gain = new MockParam(1);
    this.frequency = new MockParam(440);
  }
  connect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
  }
  createGain() { return new MockNode(); }
  createOscillator() { return new MockNode(); }
  createBufferSource() { return new MockNode(); }
}

globalThis.window = { AudioContext: MockAudioContext };

// Now import audio.js
import('../src/audio.js').then(({ sfx, music }) => {
  console.log('Testing all SFX calls...');
  sfx.laser();
  sfx.dash();
  sfx.hit();
  sfx.enemyDie();
  sfx.enemyShoot();
  sfx.playerHurt();
  sfx.playerDie();
  sfx.bossRoar();
  sfx.bossSlam();
  sfx.bossDie();
  console.log('All SFX passed!');
}).catch(err => {
  console.error('SFX Error:', err);
});
