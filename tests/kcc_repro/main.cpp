// Standalone KCC repro / trace harness.
//
// Builds a minimal world (ground + far wall), spawns a kinematic-character-controller-driven
// capsule with the live game's physics params, and runs a series of scenarios while
// dumping a per-subtick TSV trace.
//
// Scenario index:
//   A: rest -> dash (no jump)         — sanity check Issue 1 fix
//   B: rest -> jump (no dash)         — pure-jump baseline
//   C: rest -> jump+dash same tick    — best-case dash boost
//   D: rest -> jump, dash 20 ticks later  (~125 ms)
//   E: rest -> jump, dash 40 ticks later  (~250 ms)
//   F: rest -> jump, dash 80 ticks later  (~500 ms)  -> well past apex (apex ~= 12/30 = 0.4s = 64 ticks)
//
// All dashes are vertical (phi = π → dashDir = (0, +1, 0)), no WASD held, theta = 0.
//
// TSV columns:
//   scenario tick t posX posY posZ vy extX extY extZ onGround wasOnGround isJumping keys

#include <cstdio>
#include <cstdint>
#include <vector>

#include "btBulletDynamicsCommon.h"
#include "BulletCollision/CollisionDispatch/btGhostObject.h"
#include "BulletDynamics/Character/btKinematicCharacterController.h"

#ifndef SIMD_PI
#define SIMD_PI 3.1415926535897932384626433832795029
#endif

// ----- Game-side params (from /home/casey/dream/src/viz scene config) -----
struct GameParams {
  // World
  btScalar gravity            = 30.0;
  btScalar terminalVelocity   = 55.0;
  btScalar tickHz             = 160.0;

  // Player
  btScalar colliderHeight     = 2.2;   // capsule cylinder height (no caps)
  btScalar colliderRadius     = 1.14;
  btScalar jumpVelocity       = 12.0;
  btScalar moveSpeedGround    = 10.0;
  btScalar moveSpeedAir       = 13.0;
  btScalar minJumpDelay       = 0.25;
  btScalar maxSlopeRadians    = 0.8;
  btScalar maxPenetrationDepth = 0.075;
  btScalar stepHeight         = 0.05;

  // Dash
  bool     dashEnabled          = true;
  btScalar dashMagnitude        = 16.0;
  btScalar minDashDelay         = 0.85;
  bool     dashUseExternalVel   = true;

  // External-velocity damping (per-component)
  btVector3 extVelAirDamping    = btVector3(0.32, 0.30, 0.32);
  btVector3 extVelGroundDamping = btVector3(0.9992, 0.9992, 0.9992);
};

struct WorldHandles {
  btDefaultCollisionConfiguration*     config = nullptr;
  btCollisionDispatcher*               dispatcher = nullptr;
  btDbvtBroadphase*                    broadphase = nullptr;
  btSequentialImpulseConstraintSolver* solver = nullptr;
  btDiscreteDynamicsWorld*             world  = nullptr;
  btGhostPairCallback*                 ghostCb = nullptr;

  std::vector<btCollisionShape*>       shapes;
  std::vector<btCollisionObject*>      collisionObjects;

  btPairCachingGhostObject*            playerGhost = nullptr;
  btCapsuleShape*                      playerShape = nullptr;
  btKinematicCharacterController*      controller  = nullptr;
};

// Broadphase filter groups, mirroring the game (collision.ts):
static const short kStaticFilter    = 1;
static const short kDefaultFilter   = 2;
static const short kCharacterFilter = 32;

static void buildWorld(WorldHandles& h, const GameParams& gp) {
  h.config     = new btDefaultCollisionConfiguration();
  h.dispatcher = new btCollisionDispatcher(h.config);
  h.broadphase = new btDbvtBroadphase();
  h.solver     = new btSequentialImpulseConstraintSolver();
  h.world      = new btDiscreteDynamicsWorld(h.dispatcher, h.broadphase, h.solver, h.config);
  h.world->setGravity(btVector3(0, -gp.gravity, 0));
  h.ghostCb = new btGhostPairCallback();
  h.broadphase->getOverlappingPairCache()->setInternalGhostPairCallback(h.ghostCb);

  // ------ Ground: large static box, top surface at y=0 ------
  {
    btBoxShape* shape = new btBoxShape(btVector3(200, 0.5, 200));
    h.shapes.push_back(shape);

    btTransform t;
    t.setIdentity();
    t.setOrigin(btVector3(0, -0.5, 0)); // top face at y = 0
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(1); // arbitrary tag
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }

  // ------ Wall: smaller static box, 8 m forward (-Z), 2 m tall ------
  {
    btBoxShape* shape = new btBoxShape(btVector3(2.0, 2.0, 0.5));
    h.shapes.push_back(shape);

    btTransform t;
    t.setIdentity();
    t.setOrigin(btVector3(0, 2.0, -8.0));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(2);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }

  // ---- Extra geometry for regression scenarios L–P, placed far from A–K (x = +30, +50, +70). ----
  //
  // Corner pair @ x=+30 (for scenario N):
  //   Wall A: AABB center (30, 2, -8), extents (2, 2, 0.5) -> front face z = -7.5, x in [28, 32]
  //   Wall B: AABB center (32.5, 2, -5.5), extents (0.5, 2, 2.5) -> left face x = 32, z in [-8, -3]
  //   Inside corner at (x = 32, z = -7.5).  Player will dash diagonally into the corner.
  {
    btBoxShape* shape = new btBoxShape(btVector3(2.0, 2.0, 0.5));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(30.0, 2.0, -8.0));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(3);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }
  {
    btBoxShape* shape = new btBoxShape(btVector3(0.5, 2.0, 2.5));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(32.5, 2.0, -5.5));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(4);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }

  // Ramp @ x=+50 (for scenario O): tilted box ~25° around X axis.  Walk up with W held.
  // Half-extents (4, 0.2, 4); rotated so the +Z end is higher.  Top face has normal pointing
  // up-and-toward-+Z when rotated around X.  Pitch = +25° around X = surface tilts toward -Z.
  {
    btBoxShape* shape = new btBoxShape(btVector3(4.0, 0.2, 4.0));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(50.0, 1.0, 0.0));
    btQuaternion q;
    q.setEulerZYX(0, 0, btScalar(25.0 * SIMD_PI / 180.0)); // pitch around X
    t.setRotation(q);
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(5);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }

  // 3-wall U-pocket @ x=+90 (for scenario Q): a tight pocket where the player starts in
  // initial overlap with multiple walls.  Exercises iterative projection — single-pass would
  // leave residual into-wall components after the first contact's projection introduces a
  // new component for the next.
  //   Back wall (-Z normal):  AABB center (90, 2, -10),    extents (3,   2, 0.5)
  //   Left wall (+X normal):  AABB center (86.5, 2, -8),   extents (0.5, 2, 2.5)
  //   Right wall (-X normal): AABB center (93.5, 2, -8),   extents (0.5, 2, 2.5)
  // Pocket interior: x ∈ [87, 93], z ∈ [-9.5, -5.5], y unbounded above.
  {
    btBoxShape* shape = new btBoxShape(btVector3(3.0, 2.0, 0.5));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(90.0, 2.0, -10.0));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(7);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }
  {
    btBoxShape* shape = new btBoxShape(btVector3(0.5, 2.0, 2.5));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(86.5, 2.0, -8.0));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(8);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }
  {
    btBoxShape* shape = new btBoxShape(btVector3(0.5, 2.0, 2.5));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(93.5, 2.0, -8.0));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(9);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }

  // Ceiling @ x=+70 (for scenario P): horizontal slab at y=6, halfExtents (3, 0.2, 3).
  // Bottom face y=5.8.  Settled capsule top at ≈4.98 (clear).  Jump-only apex puts
  // capsule top at ≈7.4 (well above ceiling) → reliable head contact during jump.
  {
    btBoxShape* shape = new btBoxShape(btVector3(3.0, 0.2, 3.0));
    h.shapes.push_back(shape);
    btTransform t; t.setIdentity();
    t.setOrigin(btVector3(70.0, 6.0, 0.0));
    btCollisionObject* obj = new btCollisionObject();
    obj->setCollisionShape(shape);
    obj->setWorldTransform(t);
    obj->setCollisionFlags(obj->getCollisionFlags() | btCollisionObject::CF_STATIC_OBJECT);
    obj->setUserIndex(6);
    h.world->addCollisionObject(obj, kStaticFilter, kDefaultFilter | kCharacterFilter);
    h.collisionObjects.push_back(obj);
  }

  // ------ Player: kinematic-ghost capsule ------
  h.playerGhost = new btPairCachingGhostObject();
  h.playerShape = new btCapsuleShape(gp.colliderRadius, gp.colliderHeight);
  h.shapes.push_back(h.playerShape);

  btTransform t;
  t.setIdentity();
  // Match game: player Y origin = spawn.y + height/2 + radius (puts feet at spawn.y).
  // Spawn at (0, 0, 0) in feet-coords, well clear of the wall.
  btScalar feetSpawnY = 0.5; // start a bit above ground so the first tick can settle
  t.setOrigin(btVector3(0, feetSpawnY + gp.colliderHeight * 0.5 + gp.colliderRadius, 0));
  h.playerGhost->setWorldTransform(t);
  h.playerGhost->setCollisionShape(h.playerShape);
  h.playerGhost->setCollisionFlags(h.playerGhost->getCollisionFlags() | btCollisionObject::CF_CHARACTER_OBJECT);
  h.world->addCollisionObject(h.playerGhost, kCharacterFilter, kStaticFilter | kDefaultFilter);

  h.controller = new btKinematicCharacterController(
    h.playerGhost, h.playerShape, gp.stepHeight, btVector3(0, 1, 0));
  h.controller->setGravity(btVector3(0, -gp.gravity, 0));
  h.controller->setJumpSpeed(gp.jumpVelocity);
  h.controller->setFallSpeed(gp.terminalVelocity);
  h.controller->setMaxSlope(gp.maxSlopeRadians);
  h.controller->setMaxPenetrationDepth(gp.maxPenetrationDepth);
  h.controller->setMoveSpeed(gp.moveSpeedGround, gp.moveSpeedAir);
  h.controller->setMinJumpDelay(gp.minJumpDelay);
  h.controller->setExternalVelocityAirDampingFactor(gp.extVelAirDamping);
  h.controller->setExternalVelocityGroundDampingFactor(gp.extVelGroundDamping);
  h.controller->setDashConfig(gp.dashEnabled, gp.dashMagnitude, gp.minDashDelay, gp.dashUseExternalVel);
  h.world->addAction(h.controller);
}

static void destroyWorld(WorldHandles& h) {
  if (h.world && h.controller) h.world->removeAction(h.controller);
  delete h.controller; h.controller = nullptr;
  if (h.world && h.playerGhost) h.world->removeCollisionObject(h.playerGhost);
  delete h.playerGhost; h.playerGhost = nullptr;
  for (btCollisionObject* o : h.collisionObjects) {
    if (h.world) h.world->removeCollisionObject(o);
    delete o;
  }
  h.collisionObjects.clear();
  for (btCollisionShape* s : h.shapes) delete s;
  h.shapes.clear();
  delete h.world;       h.world = nullptr;
  delete h.solver;      h.solver = nullptr;
  delete h.broadphase;  h.broadphase = nullptr;
  delete h.dispatcher;  h.dispatcher = nullptr;
  delete h.config;      h.config = nullptr;
  delete h.ghostCb;     h.ghostCb = nullptr;
}

// Reset controller + warp player to spawn so each scenario starts from a clean slate.
// `feetX`/`feetZ` give the desired XZ position of the player's feet (capsule center is
// translated up by height/2 + radius).
static void resetForScenario(WorldHandles& h, const GameParams& gp,
                             btScalar feetX = 0, btScalar feetZ = 0) {
  h.controller->resetForNewRun();

  // Clear collision-cache state too — keeps the DBVT and overlap caches consistent.
  h.controller->resetCollisionCache(h.world, kCharacterFilter, kStaticFilter | kDefaultFilter);

  btTransform t;
  t.setIdentity();
  btScalar feetSpawnY = 0.5;
  t.setOrigin(btVector3(feetX, feetSpawnY + gp.colliderHeight * 0.5 + gp.colliderRadius, feetZ));
  h.playerGhost->setWorldTransform(t);
  h.controller->warp(t.getOrigin());
}

// Pretty-print one TSV row for the current subtick.
static void emitRow(const char* scenario, int tick, btScalar t, WorldHandles& h, int keys) {
  btVector3 pos = h.controller->getPosition();
  btVector3 ext = h.controller->getExternalVelocity();
  btScalar  vy  = h.controller->getVerticalVelocity();
  bool og  = h.controller->onGround();
  bool isj = h.controller->isJumping();
  // Note: m_wasOnGround is not exposed; we have only m_onGround. wasOnGround at row-emit
  // time would be the value used during the just-completed tick. Print onGround twice for
  // simplicity and post-process if needed.
  printf("%s\t%d\t%.4f\t%.5f\t%.5f\t%.5f\t%.5f\t%.5f\t%.5f\t%.5f\t%d\t%d\t%d\t%d\n",
         scenario, tick, double(t),
         double(pos.x()), double(pos.y()), double(pos.z()),
         double(vy),
         double(ext.x()), double(ext.y()), double(ext.z()),
         og ? 1 : 0, og ? 1 : 0, isj ? 1 : 0, keys);
}

// Stranding detector: warns to stderr if there is a run of >= STRANDED_RUN_TICKS where the
// player should clearly be moving UP (analytical expectedΔy > STRANDED_MIN_EXPECTED_DY) but
// the actual Δy is well below that.  This catches the original wall-stranding bug
// (extY ~20, vy ~8 → expected ~0.18 m/tick, actual ~0.05 for ~25 ticks) without firing on
// the normal apex/falling phase where (vy + extY) goes net-negative.
static const int      STRANDED_RUN_TICKS         = 6;
static const btScalar STRANDED_RATIO             = btScalar(0.5);
static const btScalar STRANDED_MIN_EXPECTED_DY   = btScalar(0.05);

struct TickSample { btScalar posY, vy, extY; };

static void checkStranding(const char* label, const std::vector<TickSample>& samples, btScalar dt) {
  int run = 0, runStart = -1, worstRun = 0, worstRunStart = -1;
  for (size_t i = 1; i < samples.size(); i++) {
    btScalar dy       = samples[i].posY - samples[i-1].posY;
    btScalar expected = (samples[i-1].vy + samples[i-1].extY) * dt;
    bool stranded = expected > STRANDED_MIN_EXPECTED_DY &&
                    dy < expected * STRANDED_RATIO;
    if (stranded) {
      if (run == 0) runStart = int(i - 1);
      run++;
      if (run > worstRun) { worstRun = run; worstRunStart = runStart; }
    } else {
      run = 0;
    }
  }
  if (worstRun >= STRANDED_RUN_TICKS) {
    fprintf(stderr,
            "[stranded] %s: %d consecutive ticks of suspect Δy starting at tick %d "
            "(expected > %.2f m/tick, Δy < expected*%.2f)\n",
            label, worstRun, worstRunStart, double(STRANDED_MIN_EXPECTED_DY), double(STRANDED_RATIO));
  }
}

// One scenario's run loop. Sends keys per-tick from the supplied callback.
//
// keysAt(tick) returns the input-keyflag bitmask the controller should see on
// that tick. Returns 0 for "no keys held".
template <typename KeysFn>
static void runScenario(const char* label, WorldHandles& h, const GameParams& gp,
                        int settleTicks, int recordTicks,
                        btScalar phi, btScalar theta, KeysFn keysAt,
                        btScalar feetX = 0, btScalar feetZ = 0,
                        bool expectStranding = false) {
  resetForScenario(h, gp, feetX, feetZ);
  const btScalar dt = btScalar(1.0) / gp.tickHz;

  // Settle phase: no inputs, world progresses, controller drops to ground.
  for (int i = 0; i < settleTicks; ++i) {
    h.controller->setInputState(0, 0, 0, true);
    h.world->substepSimulation(dt);
  }

  std::vector<TickSample> samples;
  samples.reserve(recordTicks);

  // Record phase: record before each step so we capture the post-substep state of the previous tick.
  for (int i = 0; i < recordTicks; ++i) {
    int keys = keysAt(i);
    h.controller->setInputState(keys, theta, phi, true);
    h.world->substepSimulation(dt);
    emitRow(label, i, btScalar(i) * dt, h, keys);
    btVector3 pos = h.controller->getPosition();
    btVector3 ext = h.controller->getExternalVelocity();
    samples.push_back({pos.y(), h.controller->getVerticalVelocity(), ext.y()});
  }

  if (!expectStranding) checkStranding(label, samples, dt);
}

int main() {
  GameParams gp;
  WorldHandles h;
  buildWorld(h, gp);

  // Header
  printf("scenario\ttick\tt\tposX\tposY\tposZ\tvy\textX\textY\textZ\tonGround\twasOnGround\tisJumping\tkeys\n");

  const int settle = 80;     // 0.5 s
  const int record = 320;    // 2.0 s — enough to cover full jump-to-land round trip
  const btScalar phiUp   = btScalar(SIMD_PI);   // dashDir = (0, +1, 0)
  const btScalar thetaZ  = btScalar(0);

  // Scenario A: dash only, from rest on ground (issue-1 sanity).
  runScenario("A_dashOnly", h, gp, settle, record, phiUp, thetaZ, [](int t) {
    return (t == 0) ? 32 : 0;
  });

  // Scenario B: jump only, from rest. Baseline.
  runScenario("B_jumpOnly", h, gp, settle, record, phiUp, thetaZ, [](int t) {
    return (t == 0) ? 16 : 0;
  });

  // Scenario C: jump + dash same tick.
  runScenario("C_jumpDashSim", h, gp, settle, record, phiUp, thetaZ, [](int t) {
    return (t == 0) ? (16 | 32) : 0;
  });

  // Scenario D: jump, dash 20 ticks later (~125 ms).
  runScenario("D_jumpDash20", h, gp, settle, record, phiUp, thetaZ, [](int t) {
    if (t == 0)  return 16;
    if (t == 20) return 32;
    return 0;
  });

  // Scenario E: jump, dash 40 ticks later (~250 ms).
  runScenario("E_jumpDash40", h, gp, settle, record, phiUp, thetaZ, [](int t) {
    if (t == 0)  return 16;
    if (t == 40) return 32;
    return 0;
  });

  // Scenario F: jump, dash 80 ticks later (~500 ms — past apex).
  runScenario("F_jumpDash80", h, gp, settle, record, phiUp, thetaZ, [](int t) {
    if (t == 0)  return 16;
    if (t == 80) return 32;
    return 0;
  });

  // ---- Wall-interaction scenarios (the user-reported "weird vertical levelling" bug) ----
  //
  // Wall: AABB centered (0, 2, -8) with halfExtents (2, 2, 0.5). Front face at z = -7.5.
  // Capsule radius 1.14 → capsule front at (capsule_z - 1.14). Spawn capsule center at
  // z = -6.10 → capsule front at z = -7.24, leaving ~0.26 m gap to the wall.  Dash will
  // close that gap and slam the capsule into the wall.
  //
  // Dash angle (theta=0, phi=0.95π → mostly up, slightly into wall):
  //   sinPhi ≈ 0.156, cosPhi ≈ -0.988
  //   dashDir = (-sinPhi·sinθ, -cosPhi, -sinPhi·cosθ) = (0, +0.988, -0.156)
  // i.e. ~98.8% up, ~15.6% into the wall (-Z).
  //
  // Theta=0 gives "forward = -Z" which matches the wall's location.
  const btScalar phiSlightIntoWall = btScalar(0.95) * btScalar(SIMD_PI);
  // Capsule center at z = -6.30 → capsule front at z = -7.44, wall front at z = -7.5.
  // Gap 0.06 m: barely-touching, dash will close it on tick 1.
  const btScalar feetNearWallZ     = btScalar(-6.30);

  // G: jump + dash at +10 ticks, near wall, slight-into-wall angle (the user repro).
  runScenario("G_wallJumpDash10", h, gp, settle, record, phiSlightIntoWall, thetaZ, [](int t) {
    if (t == 0)  return 16;
    if (t == 10) return 32;
    return 0;
  }, /*feetX=*/0, /*feetZ=*/feetNearWallZ);

  // H: jump + dash same tick, near wall (control: does the wall break the simultaneous case too?).
  runScenario("H_wallJumpDashSim", h, gp, settle, record, phiSlightIntoWall, thetaZ, [](int t) {
    return (t == 0) ? (16 | 32) : 0;
  }, /*feetX=*/0, /*feetZ=*/feetNearWallZ);

  // I: same input timing as G but FAR from wall (control: confirms the wall is what's broken).
  runScenario("I_freeJumpDash10", h, gp, settle, record, phiSlightIntoWall, thetaZ, [](int t) {
    if (t == 0)  return 16;
    if (t == 10) return 32;
    return 0;
  }, /*feetX=*/0, /*feetZ=*/btScalar(0));

  // J: dash-only into wall (no jump), near wall — does the wall snag dash-from-rest too?
  runScenario("J_wallDashOnly", h, gp, settle, record, phiSlightIntoWall, thetaZ, [](int t) {
    return (t == 0) ? 32 : 0;
  }, /*feetX=*/0, /*feetZ=*/feetNearWallZ);

  // K: same as G but holding W (forward) the whole time. If the bug is the
  // anti-oscillation `dot(m_normalizedDirection) <= 0` check firing when
  // m_normalizedDirection is zero, then a non-zero walk direction should make
  // the bug disappear.
  runScenario("K_wallJumpDash10W", h, gp, settle, record, phiSlightIntoWall, thetaZ, [](int t) {
    int base = 1; // W held
    if (t == 0)  return base | 16;
    if (t == 10) return base | 32;
    return base;
  }, /*feetX=*/0, /*feetZ=*/feetNearWallZ);

  // ---- Regression scenarios L–P (run after the fix lands; should be unaffected). ----

  // L: flat-ground walk forward, no wall (spawn far from existing wall).  Just confirms
  // baseline movement is unchanged by the new projection logic.
  // theta=0 means dashDir is into -Z, but for walk W also resolves into -Z.
  runScenario("L_flatWalk", h, gp, settle, /*recordTicks=*/160, btScalar(SIMD_PI / 2), thetaZ,
              [](int t) { return 1; }, /*feetX=*/-20, /*feetZ=*/20);

  // M: walk into existing wall (no jump, no dash), W held.  Confirms wall-slide & stop-dead
  // feel doesn't change.  Player approaches the wall and presses against it.
  runScenario("M_wallWalk", h, gp, settle, /*recordTicks=*/160, btScalar(SIMD_PI / 2), thetaZ,
              [](int t) { return 1; }, /*feetX=*/0, /*feetZ=*/feetNearWallZ);

  // N: corner dash.  Spawn near inside corner of the +x wall pair (x=32, z=-7.5).
  // Place capsule so it's barely-touching wall A (z front -7.5, gap 0.06 m to capsule
  // front at -7.44 → feetZ = -7.44 + 1.14 = -6.30) AND barely-touching wall B (x left 32,
  // gap 0.06 m to capsule front at +31.94 → feetX = 31.94 - 1.14 = 30.80).
  // Dash diagonally NE-and-up: theta=-π/4, phi=0.95π → dir ≈ (+0.110, +0.988, -0.110).
  const btScalar phiCornerDash = btScalar(0.95) * btScalar(SIMD_PI);
  const btScalar thetaCornerDash = btScalar(-SIMD_PI / 4);
  runScenario("N_cornerDash", h, gp, settle, /*recordTicks=*/160, phiCornerDash, thetaCornerDash,
              [](int t) {
                if (t == 0)  return 16;          // jump tick 0
                if (t == 10) return 32;          // dash tick 10
                return 0;
              }, /*feetX=*/btScalar(30.80), /*feetZ=*/btScalar(-6.30));

  // Q: 3-wall pocket dash.  Player starts in the U-pocket at x=+90 with capsule barely
  // overlapping the back wall AND the left wall (positioned ~0.06 m into each).  Dash points
  // mostly up plus diagonally into back-and-left, pushing the projection to handle two
  // simultaneous opposing contacts.  The right wall is also nearby; if iter 1's projection
  // accidentally redirects velocity toward it, iter 2 catches it.  No stranding expected.
  // Capsule radius 1.14: feetX = 87 + 0.06 + 1.14 = 88.08 (overlap left wall by 0.06).
  //                     feetZ = -9.5 + 0.06 + 1.14 - (1.14 - 1.14) → -8.42
  //                     (back-wall front face z = -9.5; capsule front z = feetZ - 1.14 = -9.56 → 0.06 overlap).
  // Dash dir (phi=0.95π, theta=π/4): ≈ (-0.110, +0.988, -0.110) → pushes -X AND -Z + up.
  runScenario("Q_pocketDash", h, gp, settle, /*recordTicks=*/160,
              btScalar(0.95) * btScalar(SIMD_PI), btScalar(SIMD_PI / 4),
              [](int t) {
                if (t == 0)  return 16;
                if (t == 10) return 32;
                return 0;
              }, /*feetX=*/btScalar(88.08), /*feetZ=*/btScalar(-8.42));

  // O: ramp walk-up with W held.  Ramp is tilted +25° around X at x=+50.  Standing on the
  // low end, walking forward (W) should climb up the ramp.  Verifies floor-projection
  // doesn't strip ramp-following motion.
  // Top face approx normal = (0, cos(25°), -sin(25°)) ≈ (0, 0.906, -0.423).  Walkable
  // (cosine 0.906 > maxSlopeCosine ≈ 0.697).
  // Place capsule at x=50, z=+3 (low end of ramp), feet on the surface.  resetForScenario
  // sets feetSpawnY to 0.5 hardcoded — for the ramp surface at z=+3, top y ≈ 1.0 + sin(25°)·3 ≈ 2.27.
  // Spawning at feetY=0.5 means we drop in mid-air, settle phase lets us land on the ramp.
  // 80 settle ticks should be enough for a 1.7 m drop.
  runScenario("O_rampWalkUp", h, gp, settle, /*recordTicks=*/240,
              btScalar(SIMD_PI / 2), thetaZ,
              [](int t) { return 1; }, /*feetX=*/50, /*feetZ=*/btScalar(3.0));

  // P: jump+dash straight up under a low ceiling (slab at y=6).  Confirms downward-pointing
  // contact normals are handled — projection should strip vertical motion when the head
  // touches the ceiling.  Stranding is *expected* here (ceiling blocks the dash), so opt out
  // of the per-scenario stranding warning.
  runScenario("P_ceilingJumpDash", h, gp, settle, /*recordTicks=*/240, phiUp, thetaZ,
              [](int t) {
                if (t == 0) return (16 | 32);   // jump + dash same tick (max apex)
                return 0;
              }, /*feetX=*/70, /*feetZ=*/0, /*expectStranding=*/true);

  destroyWorld(h);
  return 0;
}
