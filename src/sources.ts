import avatarModel from "./assets/models/avatar.glb";
import phpLogoModel from "./assets/elephant/php.glb";
import labModel from "./assets/models/lab.glb";
import roomModel from "./assets/models/room.glb";
import contactModel from "./assets/models/contact.glb";
import laptopModel from "./assets/glb/laptop.glb";
import babyElephantModel from "./assets/glb/baby_elephant.glb";

import contactTexture from "./assets/textures/contact.webp";
import contactShadowTexture from "./assets/textures/contact-shadow.webp";
import desktopsTexture from "./assets/textures/desktops.webp";
import diffuseMap from "./assets/textures/diffuse-map.png";
import faceTexture from "./assets/textures/face-spritesheet.png";
import headTexture from "./assets/textures/head.webp";
import iconSpritesheet from "./assets/textures/icon-spritesheet.webp";
import matcapBlack from "./assets/textures/matcap-black.webp";
import matcapGray from "./assets/textures/matcap-gray.webp";
import matcapSkin from "./assets/textures/matcap-skin.webp";
import matcapWhite from "./assets/textures/matcap-white.webp";
import numbersBitmap from "./assets/textures/numbers-bitmap.webp";
import roomTexture from "./assets/textures/room.webp";
import roomShadowTexture from "./assets/textures/room-shadow.webp";
import hologramPlaneTexture from "./assets/textures/hologram-plane.webp";

export type Source = {
  name: string;
  type: "gltfModel" | "objModel" | "texture";
  path: string;
};

export const sources = [
  //models
  { name: "avatar-model", type: "gltfModel", path: avatarModel },
  { name: "php-logo-model", type: "gltfModel", path: phpLogoModel },
  { name: "lab-model", type: "gltfModel", path: labModel },
  { name: "room-model", type: "gltfModel", path: roomModel },
  { name: "contact-model", type: "gltfModel", path: contactModel },
  { name: "laptop-model", type: "gltfModel", path: laptopModel },
  { name: "baby-elephant-model", type: "gltfModel", path: babyElephantModel },

  //textures
  { name: "contact-texture", type: "texture", path: contactTexture },
  { name: "contact-shadow-texture", type: "texture", path: contactShadowTexture },
  { name: "desktops-texture", type: "texture", path: desktopsTexture },
  { name: "diffuse-map", type: "texture", path: diffuseMap },
  { name: "face-texture", type: "texture", path: faceTexture },
  { name: "head-texture", type: "texture", path: headTexture },
  { name: "hologram-plane-texture", type: "texture", path: hologramPlaneTexture },
  { name: "icon-spritesheet", type: "texture", path: iconSpritesheet },
  { name: "matcap-black", type: "texture", path: matcapBlack },
  { name: "matcap-gray", type: "texture", path: matcapGray },
  { name: "matcap-skin", type: "texture", path: matcapSkin },
  { name: "matcap-white", type: "texture", path: matcapWhite },
  { name: "numbers-bitmap", type: "texture", path: numbersBitmap },
  { name: "room-texture", type: "texture", path: roomTexture },
  { name: "room-shadow-texture", type: "texture", path: roomShadowTexture },
] as const satisfies Source[];
