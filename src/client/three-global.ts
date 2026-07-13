// Loads three.js from the local npm package (not a CDN, which Devvit blocks)
// and exposes it as the global `THREE` that game.js expects.
import * as THREE from 'three';
(window as any).THREE = THREE;
