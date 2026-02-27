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
#include "btZoneEvent.h"

#include "BulletCollision/BroadphaseCollision/btCollisionAlgorithm.h"

class btCollisionShape;
class btConvexShape;
class btRigidBody;
class btCollisionWorld;
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
  // I want to remove this in favor of external velocity.
  btScalar m_verticalVelocity;
  // distance along the jump axis that the player wants to move during this step
  // I want to remove this in favor of external velocity.
  btScalar m_verticalOffset;

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

  // max fall speed
  btScalar m_terminalVelocity;
  btScalar m_defaultJumpSpeed;
  // Slope angle that is set (used for returning the exact value)
  btScalar m_maxSlopeRadians;
  // Cosine equivalent of m_maxSlopeRadians (calculated once when set, for optimization)
  btScalar m_maxSlopeCosine;
  btScalar m_gravity;

  btScalar m_stepHeight;

  btScalar m_addedMargin; //@todo: remove this and fix the code

  /// this is the desired walk direction for the current step, set by the user
  btVector3 m_walkDirection;
  btVector3 m_normalizedDirection;

  // some internal variables
  btVector3 m_currentPosition;
  btScalar m_currentStepOffset;
  btVector3 m_targetPosition;

  /// keep track of the contact manifolds
  btManifoldArray m_manifoldArray;

  // if the player was on the ground at the start of the current step
  bool m_wasOnGround;
  bool m_isJumping;
  btVector3 m_up;
  btVector3 m_jumpAxis;

  // this keeps track of the total rotation that has been applied to the player over the course
  // of a full step (possibly including multiple substeps)
  btQuaternion m_forcedRotation;

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

  btAlignedObjectArray<btJumpPad*> m_jumpPads;
  btAlignedObjectArray<btBoostZone*> m_boostZones;
  btAlignedObjectArray<btSensor*> m_sensors;
  btAlignedObjectArray<btZoneEvent> m_pendingEvents;
  btScalar m_totalElapsedTime = 0;

  void processJumpPads(btCollisionWorld* collisionWorld, btScalar dt);
  void processBoostZones(btCollisionWorld* collisionWorld, btScalar dt);
  void processSensors(btCollisionWorld* collisionWorld);
  bool checkZoneOverlap(btCollisionWorld* world, btPairCachingGhostObject* zoneGhost);
  bool checkZoneOverlapWithPenetration(btCollisionWorld* world, btPairCachingGhostObject* zoneGhost, btScalar minPenetrationDepth);

  btVector3 computeReflectionDirection(const btVector3& direction, const btVector3& normal);
  btVector3 parallelComponent(const btVector3& direction, const btVector3& normal);
  btVector3 perpindicularComponent(const btVector3& direction, const btVector3& normal);

  bool recoverFromPenetration(btCollisionWorld * collisionWorld);
  void recoverPreExistingPenetration(btCollisionWorld * collisionWorld);
  void stepUp(btCollisionWorld * collisionWorld);
  void updateTargetPositionBasedOnCollision(
    const btVector3& hit_normal, btScalar tangentMag = btScalar(0.0), btScalar normalMag = btScalar(1.0)
  );
  void stepForwardAndStrafe(btCollisionWorld * collisionWorld, btScalar dt);
  void stepDown(btCollisionWorld * collisionWorld, btScalar dt);

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

  void maybeApplyFloorLock(btCollisionWorld * collisionWorld, btScalar dt);

  void setUp(const btVector3& up);

  const btVector3& getUp() {
    return m_up;
  }

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

  void setStepHeight(btScalar h);

  void setFallSpeed(btScalar fallSpeed) {
    m_terminalVelocity = fallSpeed;
  }

  void setJumpSpeed(btScalar jumpSpeed);

  void jump(const btVector3& v = btVector3(0, 0, 0));

  void applyImpulse(const btVector3& v) {
    jump(v);
  }

  void setGravity(const btVector3& gravity);

  /// The max slope determines the maximum angle that the controller can walk up.
  ///
  /// The slope angle is measured in radians.
  void setMaxSlope(btScalar slopeRadians);

  void setMaxPenetrationDepth(btScalar d);

  bool onGround() const {
    return (fabs(m_verticalVelocity) < SIMD_EPSILON) && (fabs(m_verticalOffset) < SIMD_EPSILON);
  }

  btScalar getVerticalVelocity() const {
    return m_verticalVelocity;
  }

  void setVerticalVelocity(btScalar v) {
    m_verticalVelocity = v;
  }

  void setOnGround(bool onGround) {
    m_wasOnGround = onGround;
  }

  void resetFall() {
    if (m_verticalVelocity < 0) {
      m_verticalVelocity = 0;
    }
  }

  btScalar getVerticalOffset() const {
    return m_verticalOffset;
  }

  btVector3& getJumpAxis() {
    return m_jumpAxis;
  }

  void addExternalVelocity(const btVector3& v) {
    m_externalVelocity += v;
  }

  void setExternalVelocity(const btVector3& v) {
    m_externalVelocity = v;
  }

  void setExternalVelocityAirDampingFactor(const btVector3& v) {
    m_externalVelocityAirDampingFactor = v;
  }

  void setExternalVelocityGroundDampingFactor(const btVector3& v) {
    m_externalVelocityGroundDampingFactor = v;
  }

  btVector3& getExternalVelocity() {
    return m_externalVelocity;
  }

  btQuaternion& getForcedRotation() {
    return m_forcedRotation;
  }

  void resetForcedRotation() {
    m_forcedRotation.setValue(0., 0., 0., 1.);
  }

  bool isJumping() const {
    return m_isJumping;
  }

  int getFloorUserIndex() const {
    return m_floorUserIndex;
  }

  void addJumpPad(btJumpPad* pad) {
    m_jumpPads.push_back(pad);
  }

  void removeJumpPad(btJumpPad* pad) {
    m_jumpPads.remove(pad);
  }

  void addBoostZone(btBoostZone* zone) {
    m_boostZones.push_back(zone);
  }

  void removeBoostZone(btBoostZone* zone) {
    m_boostZones.remove(zone);
  }

  void addSensor(btSensor* sensor) {
    m_sensors.push_back(sensor);
  }

  void removeSensor(btSensor* sensor) {
    m_sensors.remove(sensor);
  }

  // Event queue access - read from JS after each substep
  int getNumPendingEvents() const {
    return m_pendingEvents.size();
  }

  int getPendingEventId(int index) const {
    return m_pendingEvents[index].m_zoneId;
  }

  int getPendingEventType(int index) const {
    return m_pendingEvents[index].m_eventType;
  }

  void clearPendingEvents() {
    m_pendingEvents.resize(0);
  }
};

#endif // BT_KINEMATIC_CHARACTER_CONTROLLER_H
