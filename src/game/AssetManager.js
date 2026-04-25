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
      sword: {},
      character: {}
    };
    this.isLoaded = false;
  }

  async loadAll(onProgress) {
    console.log('Starting asset load...');
    try {
      // 1. Load the actual models
      const [bossModel, swordModel, characterModel, goblinModel, gruntModel] = await Promise.all([
        this.loadFBX('/models/boss.fbx'),
        this.loadFBX('/models/sword.fbx'),
        this.loadFBX('/models/character.fbx'),
        this.loadFBX('/models/goblin.fbx'),
        this.loadFBX('/models/grunt.fbx')
      ]);

      this.models.boss = bossModel;
      this.models.sword = swordModel;
      this.models.character = characterModel;
      this.models.goblin = goblinModel;
      this.models.grunt = gruntModel;

      // 2. Load textures for variations
      // Boss textures
      this.textures.boss.fire = await this.loadBossTextures('fire', 'Flamy');
      this.textures.boss.ice = await this.loadBossTextures('ice', 'Ice');
      this.textures.boss.earth = await this.loadBossTextures('earth', 'Earthen');

      // Character textures
      this.textures.character = await this.loadCharacterTextures();

      this.isLoaded = true;
      console.log('All assets loaded successfully.');
    } catch (error) {
      console.error('Error loading assets:', error);
      throw error;
    }
  }

  loadFBX(url) {
    return new Promise((resolve) => {
      this.loader.load(url, 
        (fbx) => resolve(fbx),
        undefined,
        (err) => {
          console.error(`Failed to load FBX: ${url}`, err);
          resolve(null); // Fallback to null instead of crashing
        }
      );
    });
  }

  async loadBossTextures(element, fileNamePart) {
    const path = `/textures/boss/${element}/`;
    try {
      const [diffuse, normal, emissive, roughness] = await Promise.all([
        this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_Diffuse.png`),
        this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_NormalOGL.png`),
        this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_Emissive.png`),
        this.loadTexture(`${path}Elemental_LP_${fileNamePart}_Elemental_Roughness.png`)
      ]);
      return { diffuse, normal, emissive, roughness };
    } catch (e) {
      console.warn(`Boss textures for ${element} failed to load`, e);
      return {};
    }
  }

  async loadCharacterTextures() {
    const path = '/textures/character/';
    try {
      const [diffuse, normal, orm] = await Promise.all([
        this.loadTexture(`${path}T_Armor_BaseColor.png`),
        this.loadTexture(`${path}T_Armor_Normal.png`),
        this.loadTexture(`${path}T_Armor_OcclusionRoughnessMetallic.png`)
      ]);
      return { diffuse, normal, orm };
    } catch (e) {
      console.warn('Character textures failed to load', e);
      return {};
    }
  }

  loadTexture(url) {
    return new Promise((resolve) => {
      this.texLoader.load(url, 
        (tex) => {
          if (tex) tex.colorSpace = THREE.SRGBColorSpace;
          resolve(tex);
        },
        undefined,
        (err) => {
          console.warn(`Failed to load texture: ${url}`, err);
          resolve(null);
        }
      );
    });
  }

  getBossVariant(type = 0) {
    if (!this.models.boss) return null;
    const group = this.models.boss.clone();
    const elements = ['fire', 'ice', 'earth'];
    const element = elements[type % 3];
    const tex = this.textures.boss[element];

    group.traverse(child => {
      if (child.isMesh) {
        if (tex && tex.diffuse) {
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
      }
    });

    return group;
  }

  getSwordModel() {
    if (!this.models.sword) return null;
    const model = this.models.sword.clone();
    // Default scale for the sword FBX
    model.scale.set(0.015, 0.015, 0.015); 
    return model;
  }

  getCharacterModel() {
     if (!this.models.character) return null;
     const model = this.models.character.clone();
     model.scale.set(0.012, 0.012, 0.012); 

     if (this.textures.character && this.textures.character.diffuse) {
        model.traverse(child => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: this.textures.character.diffuse,
              normalMap: this.textures.character.normal,
              roughnessMap: this.textures.character.orm,
              metalness: 0.5
            });
          }
        });
     }
     return model;
  }

  getGoblinModel() {
     if (!this.models.goblin) return null;
     const model = this.models.goblin.clone();
     model.scale.set(0.01, 0.01, 0.01);
     return model;
  }

  getGruntModel() {
     const source = this.models.grunt || this.models.goblin;
     if (!source) return null;
     const model = source.clone();
     model.scale.set(0.012, 0.012, 0.012);
     return model;
  }

  getBossModel() {
     return this.getBossVariant(0);
  }

  getAnimations(modelKey) {
     const model = this.models[modelKey];
     return model ? model.animations : [];
  }
}

export const assetManager = new AssetManager();
