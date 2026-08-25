// E2E test for the character controller: btSurfaceMaterial registry (id validation,
// assignment, floor material resolution through grounding, ext-vel damping override,
// boost-strip activation), grounded-walk stability, and the steep-slope jump gate.
//
// Run directly: node tests/surface_material.mjs
import { readFileSync } from 'node:fs';

// The build's footer runs `this["Ammo"] = Module;`, which throws at ESM top level in node
// (dream's bundler wraps it in a function scope).  Patch it in-memory and import as a data URL.
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

const assert = (cond, msg) => {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok: ${msg}`);
};

const collisionConf = new Ammo.btDefaultCollisionConfiguration();
const dispatcher = new Ammo.btCollisionDispatcher(collisionConf);
const broadphase = new Ammo.btDbvtBroadphase();
const solver = new Ammo.btSequentialImpulseConstraintSolver();
const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConf);
world.setGravity(new Ammo.btVector3(0, -9.8, 0));
world
  .getBroadphase()
  .getOverlappingPairCache()
  .setInternalGhostPairCallback(new Ammo.btGhostPairCallback());

// floor box at y in [-1, 0]
const floorShape = new Ammo.btBoxShape(new Ammo.btVector3(200, 0.5, 200));
const floorTransform = new Ammo.btTransform();
floorTransform.setIdentity();
floorTransform.setOrigin(new Ammo.btVector3(0, -0.5, 0));
const motionState = new Ammo.btDefaultMotionState(floorTransform);
const rbInfo = new Ammo.btRigidBodyConstructionInfo(
  0,
  motionState,
  floorShape,
  new Ammo.btVector3(0, 0, 0)
);
const floorBody = new Ammo.btRigidBody(rbInfo);
floorBody.setCollisionFlags(1);
floorBody.setUserIndex(42);
world.addRigidBody(floorBody);

const ghost = new Ammo.btPairCachingGhostObject();
const startTransform = new Ammo.btTransform();
startTransform.setIdentity();
startTransform.setOrigin(new Ammo.btVector3(0, 5, 0));
ghost.setWorldTransform(startTransform);
const capsule = new Ammo.btCapsuleShape(0.35, 1.0);
ghost.setCollisionShape(capsule);
ghost.setCollisionFlags(16);

const controller = new Ammo.btKinematicCharacterController(
  ghost,
  capsule,
  0.35,
  new Ammo.btVector3(0, 1, 0)
);
world.addCollisionObject(ghost, 32, 1 | 2);
world.addAction(controller);
controller.setGravity(new Ammo.btVector3(0, -9.8, 0));

assert(
  !controller.setSurfaceMaterialBoost(7, 20, 0.5, 1, true),
  'setSurfaceMaterialBoost on undefined id returns false'
);
assert(
  !controller.setSurfaceMaterialExtVelGroundDamping(7, 1, 1, 1),
  'setSurfaceMaterialExtVelGroundDamping on undefined id returns false'
);
assert(!controller.assignSurfaceMaterial(floorBody, 7), 'assign of undefined id returns false');

controller.defineSurfaceMaterial(7);
assert(
  controller.setSurfaceMaterialBoost(7, 20, 0.5, 1, true),
  'setSurfaceMaterialBoost after define returns true'
);
assert(
  controller.setSurfaceMaterialExtVelGroundDamping(7, 1, 1, 1),
  'setSurfaceMaterialExtVelGroundDamping after define returns true'
);
assert(controller.assignSurfaceMaterial(floorBody, 7), 'assign of defined id returns true');

assert(controller.getFloorSurfaceMaterialId() === -1, 'floor material id is -1 before grounding');

for (let i = 0; i < 120; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
assert(controller.onGround(), 'player landed');
assert(controller.getFloorUserIndex() === 42, 'floor user index recorded');
assert(controller.getFloorSurfaceMaterialId() === 7, 'floor material id recorded from floor object');

// ext-vel kill-on-contact via (1,1,1) ground damping material: grounded external velocity dies
controller.setExternalVelocity(new Ammo.btVector3(30, 0, 30));
for (let i = 0; i < 3; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
const ev = controller.getExternalVelocity();
assert(
  Math.abs(ev.x()) < 1e-6 && Math.abs(ev.z()) < 1e-6,
  `brick-wall material kills external velocity (got ${ev.x()}, ${ev.z()})`
);

assert(controller.assignSurfaceMaterial(floorBody, -1), 'assign -1 clears material');
for (let i = 0; i < 2; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
assert(controller.getFloorSurfaceMaterialId() === -1, 'floor material id cleared after unassign');

// Graded ground damping: unlike the (1,1,1) brick wall (which routes through the
// kill-on-contact path), a fractional factor must decay through the damping math itself,
// proving the material factor (not the controller global) governs it.
controller.defineSurfaceMaterial(9);
assert(controller.setSurfaceMaterialExtVelGroundDamping(9, 0.9, 0.9, 0.9), 'graded damping material defined');
assert(controller.assignSurfaceMaterial(floorBody, 9), 'graded damping material assigned');
controller.setInputState(0, 0, 0, true);
for (let i = 0; i < 3; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
controller.setExternalVelocity(new Ammo.btVector3(10, 0, 0));
for (let i = 0; i < 30; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
const gv = controller.getExternalVelocity();
// (1-0.9)^0.5s ≈ 0.316 → ~3.2 remaining; the controller's global (0.9992) would leave ~0.3
assert(
  Math.abs(gv.x()) > 2 && Math.abs(gv.x()) < 4.5,
  `material ground damping factor governs decay (ev.x=${gv.x().toFixed(2)})`
);
controller.assignSurfaceMaterial(floorBody, -1);
controller.setExternalVelocity(new Ammo.btVector3(0, 0, 0));

// boost strip material: with aux held on the strip, ground speed should reach the
// material's target speed (4x base here)
controller.setMoveSpeed(10, 10);
controller.defineSurfaceMaterial(8);
assert(controller.setSurfaceMaterialBoost(8, 40, 0, 0, true), 'boost material defined');
assert(controller.assignSurfaceMaterial(floorBody, 8), 'boost material assigned');

const posOf = () => {
  const p = controller.getPosition();
  return [p.x(), p.z()];
};

const measureWalk = (keyFlags, armFlags) => {
  // Rising edge of aux must land while grounded on the strip: press it while stationary.
  controller.setInputState(0, 0, 0, true);
  for (let i = 0; i < 3; i++) {
    world.stepSimulation(1 / 60, 0, 1 / 60);
  }
  controller.setInputState(armFlags, 0, 0, true);
  world.stepSimulation(1 / 60, 0, 1 / 60);
  controller.setInputState(keyFlags, 0, 0, true);
  const [x0, z0] = posOf();
  let groundedTicks = 0;
  for (let i = 0; i < 60; i++) {
    world.stepSimulation(1 / 60, 0, 1 / 60);
    if (controller.onGround()) {
      groundedTicks++;
    }
  }
  const [x1, z1] = posOf();
  return { dist: Math.hypot(x1 - x0, z1 - z0), groundedTicks };
};

const base = measureWalk(1, 0); // W only
const boosted = measureWalk(1 | 64, 64); // W + aux, armed while stationary
assert(
  base.groundedTicks === 60,
  `walking on flat ground stays grounded every tick (got ${base.groundedTicks}/60)`
);
assert(
  boosted.dist > base.dist * 2 && boosted.dist < base.dist * 5,
  `boost material multiplies walk speed (base=${base.dist.toFixed(2)}, boosted=${boosted.dist.toFixed(2)})`
);

// Boost jump retention: jumping while boost-active locks walkVel * jumpRetention into
// external velocity (targetSpeed 40, retention 0.5, |moveDir| = sqrt2 → ~28).
controller.defineSurfaceMaterial(13);
assert(controller.setSurfaceMaterialBoost(13, 40, 0.5, 0, false), 'retention material defined');
assert(controller.assignSurfaceMaterial(floorBody, 13), 'retention material assigned');
controller.setInputState(0, 0, 0, true);
for (let i = 0; i < 3; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
controller.setInputState(64, 0, 0, true); // arm on strip while stationary
world.stepSimulation(1 / 60, 0, 1 / 60);
controller.setInputState(1 | 64, 0, 0, true); // run boosted
for (let i = 0; i < 5; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
controller.setInputState(1 | 64 | 16, 0, 0, true); // jump while boost-active
world.stepSimulation(1 / 60, 0, 1 / 60);
assert(controller.isJumping(), 'boosted jump fired');
const jev = controller.getExternalVelocity();
const retentionHoriz = Math.hypot(jev.x(), jev.z());
assert(
  retentionHoriz > 20 && retentionHoriz < 40,
  `boost jump retention locked into external velocity (|ev|=${retentionHoriz.toFixed(1)})`
);
controller.setInputState(0, 0, 0, true);
for (let i = 0; i < 90; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60); // land, clear jump cooldown, bleed ext vel
}
assert(controller.assignSurfaceMaterial(floorBody, -1), 'retention material cleared');

// ---- Steep-slope jump gate: jumping is denied when the floor is steeper than max slope ----

// 30-degree ramp, well away from the walk area
const rampShape = new Ammo.btBoxShape(new Ammo.btVector3(10, 0.5, 10));
const rampTransform = new Ammo.btTransform();
rampTransform.setIdentity();
rampTransform.setOrigin(new Ammo.btVector3(120, 3, 0));
const rampRot = new Ammo.btQuaternion(0, 0, 0, 1);
rampRot.setEulerZYX(0, 0, Math.PI / 6);
rampTransform.setRotation(rampRot);
const rampInfo = new Ammo.btRigidBodyConstructionInfo(
  0,
  new Ammo.btDefaultMotionState(rampTransform),
  rampShape,
  new Ammo.btVector3(0, 0, 0)
);
const rampBody = new Ammo.btRigidBody(rampInfo);
rampBody.setCollisionFlags(1);
rampBody.setUserIndex(99);
world.addRigidBody(rampBody);

const settleOnRamp = () => {
  controller.setInputState(0, 0, 0, true);
  for (let i = 0; i < 150; i++) {
    world.stepSimulation(1 / 60, 0, 1 / 60);
  }
};

const pressJump = () => {
  controller.setInputState(16, 0, 0, true);
  world.stepSimulation(1 / 60, 0, 1 / 60);
  const jumped = controller.isJumping();
  controller.setInputState(0, 0, 0, true);
  world.stepSimulation(1 / 60, 0, 1 / 60);
  return jumped;
};

controller.setMaxSlope(0.9); // ~51 deg: the 30-deg ramp is walkable
controller.warp(new Ammo.btVector3(120, 6, 0));
settleOnRamp();
assert(controller.onGround(), 'player grounded on 30-deg ramp');
assert(controller.getFloorUserIndex() === 99, 'ramp is the recorded floor');
assert(pressJump(), 'jump fires on a walkable slope');

settleOnRamp(); // land + clear jump cooldown
assert(controller.onGround(), 'player re-grounded on ramp after jump');
controller.setMaxSlope(0.35); // ~20 deg: the ramp is now steeper than max slope
assert(!pressJump(), 'jump denied when floor exceeds max slope');

// ---- Per-material climbability ----

controller.setMaxSlope(0.9); // globally walkable again; materials override from here

// Unclimbable material: maxClimbAngle ~20 deg makes the 30-deg ramp unwalkable — the player
// never grounds on it and slides off, landing on the flat floor below.
controller.defineSurfaceMaterial(11);
assert(controller.setSurfaceMaterialClimb(11, 0.35, -1, -1), 'unclimbable material defined');
assert(controller.assignSurfaceMaterial(rampBody, 11), 'unclimbable material assigned to ramp');
controller.warp(new Ammo.btVector3(120, 6, 0));
settleOnRamp();
assert(
  controller.getFloorUserIndex() === 42,
  `player slid off the unclimbable ramp onto the floor (floorIx=${controller.getFloorUserIndex()})`
);

assert(controller.assignSurfaceMaterial(rampBody, -1), 'unclimbable material cleared');
controller.warp(new Ammo.btVector3(120, 6, 0));
settleOnRamp();
assert(controller.getFloorUserIndex() === 99, 'ramp walkable again once material cleared');

// Slide-window material: walkable, but slides downhill while grounded — and enables sliding
// even though this scene never configured global slopeSlide.
controller.defineSurfaceMaterial(12);
assert(controller.setSurfaceMaterialClimb(12, -1, 0.2, 8), 'slide material defined');
assert(controller.assignSurfaceMaterial(rampBody, 12), 'slide material assigned to ramp');
controller.warp(new Ammo.btVector3(120, 6, 0));
controller.setInputState(0, 0, 0, true);
for (let i = 0; i < 60; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
assert(
  controller.onGround() && controller.getFloorUserIndex() === 99,
  'player grounded on slide-window ramp'
);
const [sx0, sz0] = posOf();
for (let i = 0; i < 30; i++) {
  world.stepSimulation(1 / 60, 0, 1 / 60);
}
const [sx1, sz1] = posOf();
const slid = Math.hypot(sx1 - sx0, sz1 - sz0);
assert(slid > 0.5, `player slides downhill while grounded (moved ${slid.toFixed(2)} in 0.5s)`);
assert(pressJump(), 'jump still allowed in the slide window (gate is maxClimbAngle)');

console.log('all passed');
