/*
Bullet Continuous Collision Detection and Physics Library
Copyright (c) 2003-2008 Erwin Coumans  http://bulletphysics.com

This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the use of this software.
Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it freely,
subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If
you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not
required.
2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original
software.
3. This notice may not be removed or altered from any source distribution.
*/

#ifndef BT_KINEMATIC_CHARACTER_CONTROLLER_H
#define BT_KINEMATIC_CHARACTER_CONTROLLER_H

#include "LinearMath/btVector3.h"
#include "LinearMath/btAlignedObjectArray.h"

#include "btCharacterControllerInterface.h"
#include "btJumpPad.h"
#include "btBoostZone.h"
#include "btSensor.h"
#include "btDashToken.h"
#include "btZoneEvent.h"

#include "BulletCollision/BroadphaseCollision/btCollisionAlgorithm.h"
#include <cmath>

class btCollisionShape;
class btConvexShape;
class btRigidBody;
class btCollisionWorld;
class btDiscreteDynamicsWorld;
class btCollisionDispatcher;
class btPairCachingGhostObject;

/// btKinematicCharacterController is an object that supports a sliding motion in a world.
/// It uses a ghost object and convex sweep test to test for upcoming collisions. This is combined with discrete
/// collision detection to recover from penetrations. Interaction between btKinematicCharacterController and dynamic
/// rigid bodies needs to be explicity implemented by the user.
ATTRIBUTE_ALIGNED16(class)
btKinematicCharacterController : public btCharacterControllerInterface {
protected:
  btPairCachingGhostObject* m_ghostObject;
  // this is also in m_ghostObject, but it needs to be convex, so we store it here to avoid upcast
  btConvexShape* m_convexShape;

  btScalar m_maxPenetrationDepth;

  // current velocity along the jump axis.  This is 0 when standing on the ground.
  btScalar m_verticalVelocity;

  // velocity that is applied to the player from external sources like jumping, dashing, boosts, etc.
  btVector3 m_externalVelocity;
  // acts as friction for the external velocity when the player is in the air.  Every 1 second,
  // the external velocity will be reduced by this factor.
  //
  // A value of 0.2 means that the external velocity will be reduced by 20% every second.
  btVector3 m_externalVelocityAirDampingFactor;
  // acts as friction for the external velocity when the player is on the ground.  Every 1 second,
  // the external velocity will be reduced by this factor.
  //
  // A value of 0.2 means that the external velocity will be reduced by 20% every second.
  btVector3 m_externalVelocityGroundDampingFactor;

  btScalar m_terminalVelocity;
  btScalar m_defaultJumpSpeed;
  // cos(the maximum slope angle that the player can walk up in radians)
  btScalar m_maxSlopeCosine;
  btScalar m_gravity;

  btScalar m_stepHeight;

  btScalar m_addedMargin; //@todo: remove this and fix the code

  /// this is the desired walk direction for the current step, set by the user
  btVector3 m_walkDirection;
  btVector3 m_normalizedDirection;

  btVector3 m_currentPosition;
  btScalar m_currentStepOffset;
  btVector3 m_targetPosition;

  btManifoldArray m_manifoldArray;

  // if the player was on the ground at the start of the current step
  bool m_wasOnGround;
  bool m_onGround;
  bool m_isJumping;
  btVector3 m_up;
  btVector3 m_jumpAxis;

  /// Stores the collision object that the player is standing on.
  ///
  /// If `onGround()` is not true, then this is the last object that the player was standing on.
  ///
  /// Defaults to null if the player has never been on the ground.
  const btCollisionObject* m_floorObject = nullptr;
  /// Stores the `userIndex` of the collision object that the player is standing on.
  ///
  /// If `onGround()` is not true, then this is the index of the last object that the player was standing on.
  ///
  /// Defaults to -1 if the player has never been on the ground.
  int m_floorUserIndex = -1;

  // Gravity shaping: allows the effective gravity to vary based on vertical velocity,
  // producing asymmetric jump curves (e.g., fast rise, long hang at apex, fast fall).
  //
  // The effective gravity multiplier is computed from three zones based on |m_verticalVelocity|:
  //   - Rise zone (v > apexThreshold): riseMultiplier
  //   - Apex zone (|v| near zero):     apexMultiplier
  //   - Fall zone (v < -apexThreshold): fallMultiplier
  //
  // Transitions between zones are smoothed by kneeWidth to avoid jarring acceleration changes.
  btScalar m_gravityShapeRiseMultiplier = 1.0;
  btScalar m_gravityShapeApexMultiplier = 1.0;
  btScalar m_gravityShapeFallMultiplier = 1.0;
  btScalar m_gravityShapeApexThreshold = 3.0;
  btScalar m_gravityShapeKneeWidth = 2.0;
  // If true, gravity shaping only applies when the player is in a jump (`m_isJumping == true`).
  // Walking off a ledge or other non-jump airborne states will use flat gravity.
  bool m_gravityShapeOnlyJumps = false;

  btScalar computeShapedGravity() const;

  // Slope sliding: when standing on a walkable surface steeper than m_slopeSlideMinAngle,
  // the player slides downhill.  Disabled by default (minAngle = 0 means off).
  //
  // m_slopeSlideMinAngle: minimum surface angle (radians from horizontal) at which sliding begins.
  //   0 = disabled.  e.g. 0.17 (~10 degrees) means any surface tilted ≥10° causes sliding.
  // m_slopeSlideMaxSpeed: maximum downhill slide speed (units/sec) reached at m_maxSlope.
  //   The actual speed is interpolated linearly between 0 (at minAngle) and this value (at maxSlope).
  btScalar m_slopeSlideMinAngle = 0;
  btScalar m_slopeSlideMaxSpeed = btScalar(5.0);
  // Cached cos of m_slopeSlideMinAngle for comparison with dot products.
  btScalar m_slopeSlideMinAngleCosine = 1.0;

  // Stores the floor contact normal from stepDown, used for slope sliding.
  btVector3 m_floorNormal = btVector3(0, 1, 0);

  btAlignedObjectArray<btJumpPad*> m_jumpPads;
  btAlignedObjectArray<btBoostZone*> m_boostZones;
  btAlignedObjectArray<btSensor*> m_sensors;
  btAlignedObjectArray<btDashToken*> m_dashTokens;
  btAlignedObjectArray<btZoneEvent> m_pendingEvents;
  btScalar m_totalElapsedTime = 0;

  // Last hit normal from cameraRayTest — (0,0,0) when no hit.
  btScalar m_cameraRayHitNX = 0;
  btScalar m_cameraRayHitNY = 0;
  btScalar m_cameraRayHitNZ = 0;
  // True when the last cameraRayTest hit an object tagged non-permeable (userIndex2 > 0).
  bool m_cameraRayHitNonPermeable = false;

  int m_inputKeyFlags = 0; // bit 0=W, 1=S, 2=A, 3=D, 4=Space, 5=Shift
  btScalar m_inputTheta = 0; // camera azimuth (yaw) in radians
  btScalar m_inputPhi = 0; // camera elevation (polar from +Y) in radians
  bool m_inputMovementEnabled = false;

  // Last move direction computed by processInputPreamble (normalized, pre-speed-scale).
  // Zero vector when no movement input.
  btVector3 m_lastMoveDir = btVector3(0, 0, 0);
  // Last dash direction computed when a dash fired.  Undefined until first dash.
  btVector3 m_lastDashDir = btVector3(0, 0, 0);

  // If true, WASD maps to world-axis movement (top-down camera).
  // If false, forward/left are derived from `m_inputTheta` (first/third person).
  bool m_topDownMode = false;

  btScalar m_moveSpeedGround = btScalar(12);
  btScalar m_moveSpeedInAir  = btScalar(12);
  btScalar m_minJumpDelaySeconds = btScalar(0.25);
  btScalar m_coyoteTimeDuration  = btScalar(0);

  btScalar m_lastJumpTime    = btScalar(-1e30);
  btScalar m_lastGroundedTime = btScalar(-1e30);

  bool m_dashEnabled = false;
  btScalar m_dashMagnitude = btScalar(16);
  btScalar m_minDashDelaySeconds = btScalar(0.85);
  bool m_dashUseExternalVelocity = false;
  btScalar m_dashCharges = INFINITY;
  btScalar m_initialDashCharges = INFINITY;
  btScalar m_checkpointDashCharges = INFINITY;
  btScalar m_lastDashTime       = btScalar(-1e30);
  bool m_dashNeedsGroundTouch = false;

  void processInputPreamble(btScalar dt);

  void processJumpPads(btCollisionWorld* collisionWorld, btScalar dt);
  void processBoostZones(btCollisionWorld* collisionWorld, btScalar dt);
  void processSensors(btCollisionWorld* collisionWorld);
  void processDashTokens(btCollisionWorld* collisionWorld);
  bool checkZoneOverlap(btCollisionWorld* world, btPairCachingGhostObject* zoneGhost);
  bool checkZoneOverlapWithPenetration(btCollisionWorld* world, btPairCachingGhostObject* zoneGhost, btScalar minPenetrationDepth);

  btVector3 computeReflectionDirection(const btVector3& direction, const btVector3& normal);
  btVector3 parallelComponent(const btVector3& direction, const btVector3& normal);
  btVector3 perpindicularComponent(const btVector3& direction, const btVector3& normal);

  bool recoverFromPenetration(btCollisionWorld * collisionWorld);
  void recoverPreExistingPenetration(btCollisionWorld * collisionWorld);
  void stepUp(btCollisionWorld* collisionWorld, btScalar& verticalOffset);
  void updateTargetPositionBasedOnCollision(
    const btVector3& hit_normal, btScalar tangentMag = btScalar(0.0), btScalar normalMag = btScalar(1.0)
  );
  void stepForwardAndStrafe(btCollisionWorld* collisionWorld, btScalar dt, btScalar verticalOffset);
  void stepDown(btCollisionWorld* collisionWorld, btScalar dt);

  virtual bool needsCollision(const btCollisionObject* body0, const btCollisionObject* body1);

  void setUpVector(const btVector3& up);

  btQuaternion getRotation(btVector3 & v0, btVector3 & v1) const;

public:
  BT_DECLARE_ALIGNED_ALLOCATOR();

  btKinematicCharacterController(
    btPairCachingGhostObject * ghostObject, btConvexShape * convexShape, btScalar stepHeight,
    const btVector3& up = btVector3(1.0, 0.0, 0.0)
  );

  ~btKinematicCharacterController() {}

  /// btActionInterface interface
  virtual void updateAction(btCollisionWorld * collisionWorld, btScalar deltaTime) {
    preStep(collisionWorld);
    playerStep(collisionWorld, deltaTime);
  }

  /// btActionInterface interface
  void debugDraw(btIDebugDraw * debugDrawer) {}

  void maybeApplyFloorLock(btCollisionWorld * collisionWorld);

  void setUp(const btVector3& up);

  const btVector3& getUp() { return m_up; }

  /// This should probably be called setPositionIncrementPerSimulatorStep.
  /// This is neither a direction nor a velocity, but the amount to increment the position each simulation iteration,
  /// regardless of dt.
  void setWalkDirection(const btVector3& walkDirection);

  void warp(const btVector3& origin);

  btVector3& getPosition() {
    return m_currentPosition;
  }

  void preStep(btCollisionWorld * collisionWorld);
  void playerStep(btCollisionWorld * collisionWorld, btScalar dt);

  void setStepHeight(btScalar h) { m_stepHeight = h; }

  void setFallSpeed(btScalar fallSpeed) {
    m_terminalVelocity = fallSpeed;
  }

  void setJumpSpeed(btScalar jumpSpeed);

  void jump(const btVector3& v = btVector3(0, 0, 0));

  void applyImpulse(const btVector3& v) { jump(v); }

  void setGravity(const btVector3& gravity);

  /// Max angle that the controller can walk up in radians
  void setMaxSlope(btScalar slopeRadians) { m_maxSlopeCosine = btCos(slopeRadians); }

  void setMaxPenetrationDepth(btScalar d) { m_maxPenetrationDepth = d; }

  /// Configure slope sliding.  Surfaces steeper than minAngle (radians) cause the
  /// player to slide downhill at up to maxSpeed (units/sec).  Set minAngle to 0 to disable.
  void setSlopeSlide(btScalar minAngle, btScalar maxSpeed) {
    m_slopeSlideMinAngle = minAngle;
    m_slopeSlideMaxSpeed = maxSpeed;
    m_slopeSlideMinAngleCosine = btCos(minAngle);
  }

  bool onGround() const { return m_onGround; }

  btScalar getVerticalVelocity() const { return m_verticalVelocity; }

  void setVerticalVelocity(btScalar v) {
    m_verticalVelocity = v;
  }

  void setOnGround(bool onGround) {
    m_onGround = onGround;
    m_wasOnGround = onGround;
  }

  void resetFall() {
    if (m_verticalVelocity < 0) {
      m_verticalVelocity = 0;
    }
  }

  btVector3& getJumpAxis() { return m_jumpAxis; }

  void addExternalVelocity(const btVector3& v) { m_externalVelocity += v; }

  void setExternalVelocity(const btVector3& v) { m_externalVelocity = v; }

  void setExternalVelocityAirDampingFactor(const btVector3& v) { m_externalVelocityAirDampingFactor = v; }

  void setExternalVelocityGroundDampingFactor(const btVector3& v) { m_externalVelocityGroundDampingFactor = v; }

  void setInputState(int keyFlags, btScalar theta, btScalar phi, bool movementEnabled) {
    m_inputKeyFlags = keyFlags;
    m_inputTheta = theta;
    m_inputPhi = phi;
    m_inputMovementEnabled = movementEnabled;
  }

  void setMoveSpeed(btScalar ground, btScalar air) {
    m_moveSpeedGround = ground;
    m_moveSpeedInAir  = air;
  }

  void setTopDownMode(bool topDown) { m_topDownMode = topDown; }

  void setMinJumpDelay(btScalar seconds) { m_minJumpDelaySeconds = seconds; }

  void setCoyoteTime(btScalar seconds) { m_coyoteTimeDuration = seconds; }

  void setDashConfig(bool enabled, btScalar magnitude, btScalar minDelay, bool useExternalVelocity) {
    m_dashEnabled             = enabled;
    m_dashMagnitude           = magnitude;
    m_minDashDelaySeconds     = minDelay;
    m_dashUseExternalVelocity = useExternalVelocity;
  }

  btScalar getLastJumpTime() const { return m_lastJumpTime; }
  btScalar getLastDashTime() const { return m_lastDashTime; }
  void setDashCharges(btScalar charges) { m_dashCharges = charges; }
  btScalar getDashCharges() const { return m_dashCharges; }
  // Returns the normalized horizontal move direction from the last subtick (pre-speed-scale).
  // Zero when no movement keys are held.
  const btVector3& getLastMoveDir() const { return m_lastMoveDir; }
  // Returns the dash direction from the last dash that fired
  const btVector3& getLastDashDir() const { return m_lastDashDir; }

  void setGravityShapeRiseMultiplier(btScalar v) { m_gravityShapeRiseMultiplier = v; }
  void setGravityShapeApexMultiplier(btScalar v) { m_gravityShapeApexMultiplier = v; }
  void setGravityShapeFallMultiplier(btScalar v) { m_gravityShapeFallMultiplier = v; }
  void setGravityShapeApexThreshold(btScalar v) { m_gravityShapeApexThreshold = v; }
  void setGravityShapeKneeWidth(btScalar v) { m_gravityShapeKneeWidth = v; }
  void setGravityShapeOnlyJumps(bool v) { m_gravityShapeOnlyJumps = v; }

  btVector3& getExternalVelocity() { return m_externalVelocity; }

  bool isJumping() const { return m_isJumping; }

  int getFloorUserIndex() const { return m_floorUserIndex; }

  void addJumpPad(btJumpPad* pad) { m_jumpPads.push_back(pad); }

  void removeJumpPad(btJumpPad* pad) { m_jumpPads.remove(pad); }

  void addBoostZone(btBoostZone* zone) { m_boostZones.push_back(zone); }

  void removeBoostZone(btBoostZone* zone) { m_boostZones.remove(zone); }

  void addSensor(btSensor* sensor) { m_sensors.push_back(sensor); }

  void removeSensor(btSensor* sensor) { m_sensors.remove(sensor); }

  void addDashToken(btDashToken* token) { m_dashTokens.push_back(token); }

  void removeDashToken(btDashToken* token) { m_dashTokens.remove(token); }

  void captureInitialDashState() {
    m_initialDashCharges = m_dashCharges;
    for (int i = 0; i < m_dashTokens.size(); i++) {
      btDashToken* token = m_dashTokens[i];
      token->m_initialActive = token->m_active;
    }
  }

  void saveDashCheckpointState() {
    m_checkpointDashCharges = m_dashCharges;
    for (int i = 0; i < m_dashTokens.size(); i++) {
      btDashToken* token = m_dashTokens[i];
      token->m_checkpointActive = token->m_active;
    }
  }

  void restoreDashCheckpointState() {
    m_dashCharges = m_checkpointDashCharges;
    for (int i = 0; i < m_dashTokens.size(); i++) {
      btDashToken* token = m_dashTokens[i];
      token->m_active = token->m_checkpointActive;
      token->m_isOverlapping = false;
    }
  }

  void resetDashStateForNewRun() {
    m_dashCharges = m_initialDashCharges;
    m_checkpointDashCharges = m_initialDashCharges;
    for (int i = 0; i < m_dashTokens.size(); i++) {
      btDashToken* token = m_dashTokens[i];
      token->m_active = token->m_initialActive;
      token->m_checkpointActive = token->m_initialActive;
      token->m_isOverlapping = false;
    }
  }

  int getNumPendingEvents() const { return m_pendingEvents.size(); }

  int getPendingEventId(int index) const { return m_pendingEvents[index].m_zoneId; }

  int getPendingEventType(int index) const { return m_pendingEvents[index].m_eventType; }

  void clearPendingEvents() { m_pendingEvents.resize(0); }

  float cameraRayTest(btCollisionWorld* world,
                      btScalar fromX, btScalar fromY, btScalar fromZ,
                      btScalar toX,   btScalar toY,   btScalar toZ);

  float getCameraRayHitNormalX() const { return m_cameraRayHitNX; }
  float getCameraRayHitNormalY() const { return m_cameraRayHitNY; }
  float getCameraRayHitNormalZ() const { return m_cameraRayHitNZ; }
  bool getCameraRayHitNonPermeable() const { return m_cameraRayHitNonPermeable; }

  int packState(void* outBuffer) const;

  /// Reset all dynamic gameplay state to match a freshly-constructed controller.
  /// Does NOT touch configuration (gravity, step height, damping, collider shape, etc.)
  void resetCollisionCache(btDiscreteDynamicsWorld* world, short filterGroup, short filterMask);

  void resetForNewRun() {
    m_verticalVelocity = 0;
    m_externalVelocity.setValue(0, 0, 0);
    m_walkDirection.setValue(0, 0, 0);
    m_normalizedDirection.setValue(0, 0, 0);
    m_currentStepOffset = 0;
    m_wasOnGround = false;
    m_onGround = false;
    m_isJumping = false;
    m_jumpAxis = m_up;
    m_floorObject = nullptr;
    m_floorUserIndex = -1;
    m_totalElapsedTime = 0;
    m_cameraRayHitNX = 0;
    m_cameraRayHitNY = 0;
    m_cameraRayHitNZ = 0;
    m_pendingEvents.clear();
    for (int i = 0; i < m_jumpPads.size(); i++) {
      m_jumpPads[i]->m_lastTriggerTime = btScalar(-1000);
    }
    m_lastJumpTime     = btScalar(-1e30);
    m_lastGroundedTime = btScalar(-1e30);
    m_lastDashTime     = btScalar(-1e30);
    m_dashNeedsGroundTouch = false;
    m_inputKeyFlags = 0;
    m_inputMovementEnabled = false;
    for (int i = 0; i < m_dashTokens.size(); i++) {
      m_dashTokens[i]->m_isOverlapping = false;
    }
  }
};

#endif // BT_KINEMATIC_CHARACTER_CONTROLLER_H
