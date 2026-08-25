// Regression coverage for the KCC's collision-world sweeps.
//
// Run directly: node tests/kcc_world_sweep.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The build's footer runs `this["Ammo"] = Module;`, which throws at ESM top level in Node.
// Dream's bundler supplies the surrounding scope, so patch only the in-memory test source.
const src = readFileSync(new URL('../builds/ammo.wasm.js', import.meta.url), 'utf8').replace(
  'this["Ammo"] = Module;',
  'globalThis["Ammo"] = Module;'
);
const { Ammo: AmmoLoader } = await import(
  `data:text/javascript;base64,${Buffer.from(src).toString('base64')}`
);
const Ammo = await AmmoLoader({
  wasmBinary: readFileSync(new URL('../builds/ammo.wasm.wasm', import.meta.url)),
});

function createWorld() {
  const collisionConf = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConf);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();
  const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConf);
  const ghostPairCallback = new Ammo.btGhostPairCallback();
  world.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(ghostPairCallback);
  world.setGravity(new Ammo.btVector3(0, -9.8, 0));
  return { world, ghostPairCallback };
}

function addSolidBox(world, x, y, z, halfX, halfY, halfZ, group = 1) {
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(halfX, halfY, halfZ));
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(x, y, z));
  const motionState = new Ammo.btDefaultMotionState(transform);
  const info = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, new Ammo.btVector3(0, 0, 0));
  const body = new Ammo.btRigidBody(info);
  body.setCollisionFlags(1);
  world.addRigidBody(body, group, 32);
  return body;
}

function addFloor(world) {
  return addSolidBox(world, 0, -0.5, 0, 5, 0.5, 5);
}

function addWall(world, z, group = 1) {
  return addSolidBox(world, 0, 1, z, 5, 2, 0.05, group);
}

function addNonResponsiveBox(world, z) {
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(5, 2, 0.05));
  const object = new Ammo.btPairCachingGhostObject();
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(0, 1, z));
  object.setWorldTransform(transform);
  object.setCollisionShape(shape);
  object.setCollisionFlags(4);
  world.addCollisionObject(object, 1, 32);
  return object;
}

function createCharacter(world, speed) {
  const ghost = new Ammo.btPairCachingGhostObject();
  const shape = new Ammo.btCapsuleShape(0.35, 1);
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(0, 0.81, 0));
  ghost.setWorldTransform(transform);
  ghost.setCollisionShape(shape);
  ghost.setCollisionFlags(16);
  world.addCollisionObject(ghost, 32, 1);

  const controller = new Ammo.btKinematicCharacterController(ghost, shape, 0.05, new Ammo.btVector3(0, 1, 0));
  controller.setGravity(new Ammo.btVector3(0, -40, 0));
  controller.setMoveSpeed(speed, speed);
  controller.setMaxPenetrationDepth(0.075);
  world.addAction(controller);
  return { ghost, controller };
}

function moveForward(world, controller, hz, ticks = 3) {
  controller.setInputState(1, 0, 0, true);
  for (let i = 0; i < ticks; i++) {
    world.substepSimulation(1 / hz);
  }
  return controller.getPosition().z();
}

for (const { speed, hz } of [
  { speed: 100, hz: 160 },
  { speed: 200, hz: 160 },
  { speed: 200, hz: 60 },
]) {
  const { world } = createWorld();
  addFloor(world);
  addWall(world, -0.6);
  const { ghost, controller } = createCharacter(world, speed);

  // Settle onto the floor and populate the pair cache at the starting pose. The wall is
  // deliberately separated from the capsule, so the floor is the only cached overlap and
  // a ghost-cache-only sweep has no wall candidate to test.
  for (let i = 0; i < 5; i++) world.substepSimulation(1 / hz);
  assert.equal(ghost.getNumOverlappingObjects(), 1);

  const z = moveForward(world, controller, hz);
  assert.ok(z > -0.25, `speed ${speed} at ${hz} Hz crossed the wall (z=${z})`);
  assert.ok(z < -0.1, `speed ${speed} at ${hz} Hz did not reach the wall (z=${z})`);
  console.log(`ok: speed ${speed} at ${hz} Hz stopped at z=${z.toFixed(4)}`);
}

{
  const { world } = createWorld();
  addFloor(world);
  addNonResponsiveBox(world, -0.6);
  addWall(world, -1.2);
  const { controller } = createCharacter(world, 200);
  for (let i = 0; i < 5; i++) world.substepSimulation(1 / 160);
  const z = moveForward(world, controller, 160);
  assert.ok(z < -0.6, `non-responsive object incorrectly blocked movement (z=${z})`);
  assert.ok(z > -0.9, `character crossed the solid wall behind the trigger (z=${z})`);
  console.log(`ok: non-responsive object ignored; solid wall stopped at z=${z.toFixed(4)}`);
}

{
  const { world } = createWorld();
  addFloor(world);
  addWall(world, -0.6, 2); // Excluded by the character's collision mask.
  addWall(world, -1.2, 1);
  const { controller } = createCharacter(world, 200);
  for (let i = 0; i < 5; i++) world.substepSimulation(1 / 160);
  const z = moveForward(world, controller, 160);
  assert.ok(z < -0.6, `filtered object incorrectly blocked movement (z=${z})`);
  assert.ok(z > -0.9, `character crossed the included wall (z=${z})`);
  console.log(`ok: collision filter ignored group 2; group 1 stopped at z=${z.toFixed(4)}`);
}

console.log('all world-sweep tests passed');
