import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { render } from "@testing-library/react";

//Global variables
let currentRef = null;
const gui = new dat.GUI();
const sceneParams = {
  // Agregando el Auxiliar
  envMapIntensity: 1,
  dlColor: 0xffffff,
  alColor: 0xffffff,
};

//Scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100);
scene.add(camera);
camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3());

const renderer = new THREE.WebGLRenderer();
// renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;
renderer.setSize(100, 100);

const rendererTweaks = gui.addFolder("Renderer");
rendererTweaks.add(renderer, "toneMappingExposure").min(1).max(10).step(0.0001);

//OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

//Resize canvas
const resize = () => {
  renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
  camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);

//Animate the scene
const animate = () => {
  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

//cube
/* let geometry = new THREE.BoxBufferGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({ wireframe: true });
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);
 */

// Agregando el LoadingManager
const loadingMananger = new THREE.LoadingManager(
  // Cuando esta cargando
  () => {
    console.log("Todo cargado");
  },
  // Cuando a cargado
  (
    // para cargar las rutas donde estan los archivo
    itemUrl,
    // Cuando estan cargando los archivos hijos
    itemToLoad,
    // Cuando han cargado todos los hijos
    itemLoaded
  ) => {
    console.log((itemToLoad / itemLoaded) * 100);
  },
  // Cuando hay un error
  () => {}
);

// Cast de sombras
const castAndReciveShadows = () => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

// Plano base
const geometria = new THREE.PlaneBufferGeometry(5, 5);
const material = new THREE.MeshStandardMaterial();

const planeBase = new THREE.Mesh(geometria, material);

planeBase.rotation.x = Math.PI * -0.5;
planeBase.position.y = -1;
scene.add(planeBase);

// GLTF
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./modelos/draco/gltf/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load(
  "/modelos/space_helmet/helmet.gltf",
  // EL GLTF en la Escena
  (gltf) => {
    while (gltf.scene.children.length) {
      console.log(gltf.scene.children[0]);
      scene.add(gltf.scene.children[0]);
    }
    castAndReciveShadows();
  },
  // Mientras esta cargando
  () => {
    console.log("Cargando archivo");
  },
  // Mensaje en caso de un Error
  () => {
    console.log("error al cargar el GLTF");
  }
);

// Agregando Folder DEBUG
const folderLights = gui.addFolder("Luces");

const envMap = new THREE.CubeTextureLoader().load([
  "/Cube-Map/nx.png",
  "/Cube-Map/ny.png",
  "/Cube-Map/nz.png",
  "/Cube-Map/px.png",
  "/Cube-Map/py.png",
  "/Cube-Map/pz.png",
]);

scene.environment = envMap;
folderLights
  .add(sceneParams, "envMapIntensity")
  .min(1)
  .max(100)
  .step(0.0001)
  .name("EnvMap Intensity")
  .onChange(() => {
    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.material.envMapIntensity = sceneParams.envMapIntensity;
      }
    });
  });

// Luces a la escena del GLTF

const luz1 = new THREE.DirectionalLight(0xffffff, 10);
luz1.position.set(0, 6, 1);
luz1.castShadow = true;
luz1.shadow.mapSize.set(1024, 1024);
luz1.shadow.bias = 0.0005;
luz1.shadow.normalBias = 0.0005;
scene.add(luz1);
folderLights
  .add(luz1, "intensity")
  .min(1)
  .max(10)
  .step(0.0001)
  .name("DL Intensity");

folderLights.addColor(sceneParams, "dlColor").onChange(() => {
  luz1.color.set(sceneParams.dlColor);
});

// Agregando luz ambiental
const luzAmbiental = new THREE.AmbientLight(0xfff, 5.9);
scene.add(luzAmbiental);
folderLights
  .add(luzAmbiental, "intensity")
  .min(1)
  .max(10)
  .step(0.0001)
  .name("AL Intensity");

folderLights.addColor(sceneParams, "alColor").onChange(() => {
  luz1.color.set(sceneParams.alColor);
});

// Organizando los controles
let AuxScale = {
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  subX: 1,
  subY: 1,
  subZ: 1,
};

/* const ScaleFolder = gui.addFolder("Cube Tweaks");

ScaleFolder.add(AuxScale, 'scaleX')
  .min(1).max(10).name("Escala en X").onChange(() => {
    cube.scale.x = AuxScale.scaleX;
  });

ScaleFolder.add(AuxScale, 'scaleY')
  .min(1).max(10).name("Escala en Y").onChange(() => {
    cube.scale.y = AuxScale.scaleY;
  });

ScaleFolder.add(AuxScale, 'scaleZ')
  .min(1).max(10).name("Escala en Z").onChange(() => {
    cube.scale.z = AuxScale.scaleZ;
  }); */

// Sub-divisiones
// const subFolder = ScaleFolder.addFolder("Subdivisiones");

/* subFolder.add(AuxScale, "subX")
  .min(1).max(5).name("Subdivisión en X").step(1).onChange(() => {
    scene.remove(cube);
    geometry = new THREE.BoxBufferGeometry(AuxScale.scaleX, AuxScale.scaleY, AuxScale.scaleZ, AuxScale.subX, AuxScale.subY, AuxScale.subZ);
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
  });
 */
//Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current;
  resize();
  currentRef.appendChild(renderer.domElement);
};

//Dismount and clean up the buffer from the scene
export const cleanUpScene = () => {
  scene.dispose();
  gui.destroy();
  currentRef.removeChild(renderer.domElement);
};
