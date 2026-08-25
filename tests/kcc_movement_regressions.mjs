// Focused Wasm regressions for KCC movement-phase ordering and step-up handling.
//
// Run directly: node tests/kcc_movement_regressions.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

const makeTransform = (x, y, z, yRotation = 0) => {
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(x, y, z));
  if (yRotation !== 0) {
    transform.setRotation(new Ammo.btQuaternion(0, Math.sin(yRotation / 2), 0, Math.cos(yRotation / 2)));
  }
  return transform;
};

const createWorld = () => {
  const collisionConf = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConf);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();
  const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConf);
  const ghostPairCallback = new Ammo.btGhostPairCallback();
  world.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(ghostPairCallback);
  return { world, ghostPairCallback };
};

const addBox = (world, { x = 0, y, z = 0, halfX, halfY, halfZ, flags = 1, group, mask }) => {
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(halfX, halfY, halfZ));
  const transform = makeTransform(x, y, z);
  const info = new Ammo.btRigidBodyConstructionInfo(
    0,
    new Ammo.btDefaultMotionState(transform),
    shape,
    new Ammo.btVector3(0, 0, 0)
  );
  const body = new Ammo.btRigidBody(info);
  body.setCollisionFlags(flags);
  if (flags === 2) body.setActivationState(4);
  if (group === undefined) world.addRigidBody(body);
  else world.addRigidBody(body, group, mask);
  return body;
};

const addFloor = world => addBox(world, { y: -0.5, halfX: 5, halfY: 0.5, halfZ: 5 });

const createCharacter = (world, { x = 0, y = 0.81, z = 0, speed = 12, maxPenetrationDepth = 0.075 } = {}) => {
  const ghost = new Ammo.btPairCachingGhostObject();
  const shape = new Ammo.btCapsuleShape(0.35, 1);
  ghost.setCollisionShape(shape);
  ghost.setWorldTransform(makeTransform(x, y, z));
  ghost.setCollisionFlags(16);
  world.addCollisionObject(ghost, 32, 1 | 2);

  const controller = new Ammo.btKinematicCharacterController(ghost, shape, 0.05, new Ammo.btVector3(0, 1, 0));
  controller.setGravity(new Ammo.btVector3(0, -40, 0));
  controller.setMoveSpeed(speed, speed);
  controller.setJumpSpeed(20);
  controller.setMaxPenetrationDepth(maxPenetrationDepth);
  world.addAction(controller);
  return { ghost, controller };
};

const getPosition = controller => {
  const p = controller.getPosition();
  return [p.x(), p.y(), p.z()];
};

const settle = (world, hz = 160, ticks = 20) => {
  for (let i = 0; i < ticks; i++) world.substepSimulation(1 / hz);
};

const runCeilingProbe = maxPenetrationDepth => {
  const { world } = createWorld();
  addFloor(world);
  const ceilingBottom = 2;
  addBox(world, { y: 2.25, halfX: 5, halfY: 0.25, halfZ: 5 });
  const { controller } = createCharacter(world, { y: 0.85, maxPenetrationDepth });
  const dt = 1 / 160;
  settle(world, 160, 10);
  controller.setInputState(16, 0, 0, true);
  world.substepSimulation(dt);
  controller.setInputState(0, 0, 0, true);

  let maxTopPenetration = -Infinity;
  for (let i = 0; i < 120; i++) {
    world.substepSimulation(dt);
    maxTopPenetration = Math.max(maxTopPenetration, controller.getPosition().y() + 0.85 - ceilingBottom);
  }
  assert.ok(controller.onGround(), `character did not return to ground at depth ${maxPenetrationDepth}`);
  return maxTopPenetration;
};

{
  const penetrationAt075 = runCeilingProbe(0.075);
  const penetrationAt02 = runCeilingProbe(0.2);
  assert.ok(penetrationAt075 <= 0.041, `ceiling sweep exceeded its contact margin: ${penetrationAt075}`);
  assert.ok(penetrationAt02 <= 0.041, `ceiling sweep exceeded its contact margin: ${penetrationAt02}`);
  assert.ok(
    Math.abs(penetrationAt075 - penetrationAt02) < 0.001,
    `ceiling result still depends on maxPenetrationDepth: ${penetrationAt075} vs ${penetrationAt02}`
  );
  console.log('ok: ceiling sweep clamps at time of impact independently of recovery depth');
}

{
  const { world } = createWorld();
  addFloor(world);
  addBox(world, { y: 0.02, z: -1, halfX: 2, halfY: 0.02, halfZ: 0.5 });
  const { controller } = createCharacter(world, { speed: 4 });
  settle(world);
  const restingY = controller.getPosition().y();
  controller.setInputState(1, 0, 0, true);
  let maxY = restingY;
  for (let i = 0; i < 100; i++) {
    world.substepSimulation(1 / 160);
    maxY = Math.max(maxY, controller.getPosition().y());
  }
  const [, , z] = getPosition(controller);
  assert.ok(maxY > restingY + 0.02, `character did not climb the 0.04-unit step (${restingY} -> ${maxY})`);
  assert.ok(z < -1.5, `character did not traverse the step (z=${z})`);
  console.log('ok: ordinary step traversal remains functional');
}

const runPlatformLaunch = ({ startX, translationX = 0, rotation = 0 }) => {
  const { world } = createWorld();
  const platform = addBox(world, {
    y: -0.5,
    halfX: 5,
    halfY: 0.5,
    halfZ: 5,
    flags: 2,
  });
  const { controller } = createCharacter(world, { x: startX });
  settle(world);
  const before = getPosition(controller);
  platform.setWorldTransform(makeTransform(translationX, -0.5, 0, rotation));
  controller.setInputState(16, 0, 0, true);
  world.substepSimulation(1 / 160);
  return { before, after: getPosition(controller), controller };
};

{
  const { before, after, controller } = runPlatformLaunch({ startX: 0, translationX: 0.5 });
  assert.ok(Math.abs(after[0] - 0.5) < 0.001, `launch missed platform translation: ${after[0]}`);
  assert.ok(after[1] > before[1], 'translated-platform jump did not ascend');
  assert.ok(!controller.onGround(), 'translated-platform jump remained grounded');
  console.log('ok: launch tick inherits platform translation');
}

{
  const { before, after, controller } = runPlatformLaunch({ startX: 1, rotation: Math.PI / 2 });
  assert.ok(Math.abs(after[0]) < 0.001, `launch missed platform rotation x: ${after[0]}`);
  assert.ok(Math.abs(after[2] + 1) < 0.001, `launch missed platform rotation z: ${after[2]}`);
  assert.ok(after[1] > before[1], 'rotating-platform jump did not ascend');
  assert.ok(!controller.onGround(), 'rotating-platform jump remained grounded');
  console.log('ok: launch tick inherits platform rotation');
}

{
  const { world } = createWorld();
  addFloor(world);
  const { controller } = createCharacter(world, { speed: 40 });

  const zone = new Ammo.btPairCachingGhostObject();
  zone.setCollisionShape(new Ammo.btBoxShape(new Ammo.btVector3(5, 2, 0.05)));
  zone.setWorldTransform(makeTransform(0, 1, -0.6));
  zone.setCollisionFlags(4);
  world.addCollisionObject(zone, 1, 32);
  controller.addSensor(new Ammo.btSensor(zone, 123, 0));

  settle(world, 160, 5);
  controller.setInputState(1, 0, 0, true);
  world.substepSimulation(1 / 160);
  assert.equal(controller.getNumPendingEvents(), 1, 'sensor entry was not emitted on the overlap tick');
  assert.equal(controller.getPendingEventId(0), 123);
  assert.equal(controller.getPendingEventType(0), 0);
  controller.clearPendingEvents();

  world.substepSimulation(1 / 160);
  assert.equal(controller.getNumPendingEvents(), 0, 'sensor emitted an event while overlap persisted');
  world.substepSimulation(1 / 160);
  assert.equal(controller.getNumPendingEvents(), 1, 'sensor leave was not emitted on the separation tick');
  assert.equal(controller.getPendingEventType(0), 1);
  console.log('ok: sensor enter/leave uses the final recovered pose in the same tick');
}

console.log('all KCC movement-regression tests passed');
