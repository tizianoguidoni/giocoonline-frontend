import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// We try to import fflate for compressed FBX support
let fflate;
try {
  fflate = require('fflate');
} catch (e) {
  console.warn('fflate not found. Compressed FBX files might fail to load.');
}

export class AssetManager {
  constructor() {
    this.loader = new FBXLoader();
    this.texLoader = new THREE.TextureLoader();
    this.models = {};
    this.textures = {
      boss: { fire: {}, ice: {}, earth: {} },
      sword: {}
    };
    this.isLoaded = false;
  }

  async loadAll(onProgress) {
    console.log('Starting asset load...');
    try {
      // 1. Load the actual models
      const [bossModel, swordModel, characterModel] = await Promise.all([
        this.loadFBX('/models/boss.fbx'),
        this.loadFBX('/models/sword.fbx'),
        this.loadFBX('/models/character.fbx')
      ]);

      this.models.boss = bossModel;
      this.models.sword = swordModel;
      this.models.character = characterModel;

      // 2. Load textures for variations
      // Boss Fire
      this.textures.boss.fire = await this.loadBossTextures('fire', 'Flamy');
      // Boss Ice
      this.textures.boss.ice = await this.loadBossTextures('ice', 'Ice');
      // Boss Earth
      this.textures.boss.earth = await this.loadBossTextures('earth', 'Earthen');

      this.isLoaded = true;
      console.log('All assets loaded successfully.');
    } catch (error) {
      console.error('Error loading assets:', error);
      throw error;
    }
  }

  loadFBX(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, 
        (fbx) => resolve(fbx),
        undefined,
        (err) => reject(err)
      );
    });
  }

  async loadBossTextures(element, fileNamePart) {
    const path = `/textures/boss/${element}/`;
    // We expect basic PBR textures: Diffuse, Normal, Emissive, Roughness
    const [diffuse, normal, emissive, roughness] = await Promise.all([
      this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_Diffuse.png`),
      this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_NormalOGL.png`),
      this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_Emissive.png`),
      this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_Roughness.png`)
    ]);
    return { diffuse, normal, emissive, roughness };
  }

  loadTexture(url) {
    return new Promise((resolve, reject) => {
      this.texLoader.load(url, 
        (tex) => resolve(tex),
        undefined,
        (err) => reject(err)
      );
    });
  }

  getBossVariant(type = 0) {
    if (!this.models.boss) return null;
    const group = this.models.boss.clone();
    const elements = ['fire', 'ice', 'earth'];
    const element = elements[type % 3];
    const tex = this.textures.boss[element];

    // Apply materials to all meshes in the FBX
    group.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: tex.diffuse,
          normalMap: tex.normal,
          emissiveMap: tex.emissive,
          emissive: element === 'fire' ? 0xff4000 : (element === 'ice' ? 0x0080ff : 0x00ff40),
          emissiveIntensity: 1.5,
          roughnessMap: tex.roughness,
          metalness: 0.1
        });
      }
    });

    return group;
  }

  getSwordModel() {
    if (!this.models.sword) return null;
    const model = this.models.sword.clone();
    model.scale.set(0.001, 0.001, 0.001); // Significant reduction to avoid screen blocking
    return model;
  }

  getCharacterModel() {
     if (!this.models.character) return null;
     const model = this.models.character.clone();
     model.scale.set(0.001, 0.001, 0.001);
     return model;
  }
}

export const assetManager = new AssetManager();
