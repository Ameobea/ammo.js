/*
Bullet Continuous Collision Detection and Physics Library
Copyright (c) 2003-2008 Erwin Coumans  http://bulletphysics.com

Modified extensively by Casey Primozic

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

#include "btKinematicCharacterController.h"
#include "BulletCollision/BroadphaseCollision/btCollisionAlgorithm.h"
#include "BulletCollision/BroadphaseCollision/btOverlappingPairCache.h"
#include "BulletCollision/CollisionDispatch/btCollisionWorld.h"
#include "BulletCollision/CollisionDispatch/btGhostObject.h"
#include "BulletCollision/CollisionShapes/btMultiSphereShape.h"
#include "LinearMath/btDefaultMotionState.h"
#include "LinearMath/btIDebugDraw.h"
#include <stdio.h>

static btVector3
getNormalizedVector(const btVector3& v) {
  btVector3 n(0, 0, 0);

  if (v.length() > SIMD_EPSILON) {
    n = v.normalized();
  }
  return n;
}

#define MAX_PENETRATION_LOOPS 16

// if set to 1, then 1/MAX_PENETRATION_LOOPS of the penetration depth will be recovered per iteration
//
// setting to higher values may reduce or prevent some cases where penetration cannot be recovered from
#define PENETRATION_RECOVERY_PER_ITER 3.

class btKinematicClosestNotMeRayResultCallback : public btCollisionWorld::ClosestRayResultCallback {
public:
  btKinematicClosestNotMeRayResultCallback(btCollisionObject* me)
    : btCollisionWorld::ClosestRayResultCallback(btVector3(0.0, 0.0, 0.0), btVector3(0.0, 0.0, 0.0)) {
    m_me = me;
  }

  virtual btScalar addSingleResult(btCollisionWorld::LocalRayResult& rayResult, bool normalInWorldSpace) {
    if (rayResult.m_collisionObject == m_me) {
      return 1.0;
    }

    return ClosestRayResultCallback::addSingleResult(rayResult, normalInWorldSpace);
  }

protected:
  btCollisionObject* m_me;
};

class btKinematicClosestNotMeConvexResultCallback : public btCollisionWorld::ClosestConvexResultCallback {
public:
  btKinematicClosestNotMeConvexResultCallback(btCollisionObject* me, const btVector3& up, btScalar minSlopeDot)
    : btCollisionWorld::ClosestConvexResultCallback(btVector3(0.0, 0.0, 0.0), btVector3(0.0, 0.0, 0.0))
    , m_me(me)
    , m_up(up)
    , m_minSlopeDot(minSlopeDot) {}

  virtual btScalar addSingleResult(btCollisionWorld::LocalConvexResult& convexResult, bool normalInWorldSpace) {
    if (convexResult.m_hitCollisionObject == m_me || !convexResult.m_hitCollisionObject->hasContactResponse()) {
      return 1.0;
    }

    btVector3 hitNormalWorld = normalInWorldSpace ? convexResult.m_hitNormalLocal
                                                  : convexResult.m_hitNormalLocal *
                                                      convexResult.m_hitCollisionObject->getWorldTransform().getBasis();

    btScalar dotUp = m_up.dot(hitNormalWorld);
    if (dotUp < m_minSlopeDot) {
      return 1.0;
    }

    return ClosestConvexResultCallback::addSingleResult(convexResult, normalInWorldSpace);
  }

protected:
  btCollisionObject* m_me;
  const btVector3 m_up;
  btScalar m_minSlopeDot;
};

/*
 * Returns the reflection direction of a ray going 'direction' hitting a surface with normal 'normal'
 *
 * from: http://www-cs-students.stanford.edu/~adityagp/final/node3.html
 */
btVector3
btKinematicCharacterController::computeReflectionDirection(const btVector3& direction, const btVector3& normal) {
  return direction - (btScalar(2.0) * direction.dot(normal)) * normal;
}

/*
 * Returns the portion of 'direction' that is parallel to 'normal'
 */
btVector3
btKinematicCharacterController::parallelComponent(const btVector3& direction, const btVector3& normal) {
  btScalar magnitude = direction.dot(normal);
  return normal * magnitude;
}

/*
 * Returns the portion of 'direction' that is perpindicular to 'normal'
 */
btVector3
btKinematicCharacterController::perpindicularComponent(const btVector3& direction, const btVector3& normal) {
  return direction - parallelComponent(direction, normal);
}

btKinematicCharacterController::btKinematicCharacterController(
  btPairCachingGhostObject* ghostObject,
  btConvexShape* convexShape,
  btScalar stepHeight,
  const btVector3& up
) {
  m_ghostObject = ghostObject;
  m_up.setValue(0.0f, 0.0f, 1.0f);
  m_jumpAxis.setValue(0.0f, 0.0f, 1.0f);
  m_addedMargin = 0.02;
  m_walkDirection.setValue(0.0, 0.0, 0.0);
  m_convexShape = convexShape;
  m_verticalVelocity = 0.0;
  m_verticalOffset = 0.0;
  m_gravity = 9.8 * 3.0;
  m_terminalVelocity = 55.0;
  m_defaultJumpSpeed = 10.0;
  m_wasOnGround = false;
  m_isJumping = false;
  m_currentStepOffset = 0.0;
  m_maxPenetrationDepth = 0.2;
  m_externalVelocityAirDampingFactor = btVector3(0.82, 0.75, 0.82);
  m_externalVelocityGroundDampingFactor = btVector3(0.9992, 0.9992, 0.9992);

  setUp(up);
  setStepHeight(stepHeight);
  setMaxSlope(btRadians(45.0));
}

// Here we must refresh the overlapping paircache as the penetrating movement itself or the
// previous recovery iteration might have used setWorldTransform and pushed us into an object
// that is not in the previous cache contents from the last timestep, as will happen if we
// are pushed into a new AABB overlap. Unhandled this means the next convex sweep gets stuck.
//
// Do this by calling the broadphase's setAabb with the moved AABB, this will update the broadphase
// paircache and the ghostobject's internal paircache at the same time.    /BW
bool
btKinematicCharacterController::recoverFromPenetration(btCollisionWorld* collisionWorld) {
  btVector3 minAabb, maxAabb;
  m_convexShape->getAabb(m_ghostObject->getWorldTransform(), minAabb, maxAabb);
  collisionWorld->getBroadphase()->setAabb(
    m_ghostObject->getBroadphaseHandle(), minAabb, maxAabb, collisionWorld->getDispatcher()
  );

  bool penetration = false;

  collisionWorld->getDispatcher()->dispatchAllCollisionPairs(
    m_ghostObject->getOverlappingPairCache(), collisionWorld->getDispatchInfo(), collisionWorld->getDispatcher()
  );

  m_currentPosition = m_ghostObject->getWorldTransform().getOrigin();

  for (int i = 0; i < m_ghostObject->getOverlappingPairCache()->getNumOverlappingPairs(); i++) {
    m_manifoldArray.resize(0);

    btBroadphasePair* collisionPair = &m_ghostObject->getOverlappingPairCache()->getOverlappingPairArray()[i];

    btCollisionObject* obj0 = static_cast<btCollisionObject*>(collisionPair->m_pProxy0->m_clientObject);
    btCollisionObject* obj1 = static_cast<btCollisionObject*>(collisionPair->m_pProxy1->m_clientObject);

    if ((obj0 && !obj0->hasContactResponse()) || (obj1 && !obj1->hasContactResponse()) || !needsCollision(obj0, obj1)) {
      continue;
    }

    if (collisionPair->m_algorithm) {
      collisionPair->m_algorithm->getAllContactManifolds(m_manifoldArray);
    }

    for (int j = 0; j < m_manifoldArray.size(); j++) {
      btPersistentManifold* manifold = m_manifoldArray[j];
      btScalar directionSign = manifold->getBody0() == m_ghostObject ? btScalar(-1.0) : btScalar(1.0);
      for (int p = 0; p < manifold->getNumContacts(); p++) {
        const btManifoldPoint& pt = manifold->getContactPoint(p);

        btScalar dist = pt.getDistance();

        if (dist < -m_maxPenetrationDepth) {
          m_currentPosition += pt.m_normalWorldOnB * directionSign * dist *
                               btScalar(1. / (btScalar(MAX_PENETRATION_LOOPS) / PENETRATION_RECOVERY_PER_ITER));
          penetration = true;
        }
      }
    }
  }
  btTransform newTrans = m_ghostObject->getWorldTransform();
  newTrans.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(newTrans);
  return penetration;
}

// If the player is on the ground and the object they're standing on is non-static, then we apply motions from that
// object to the player's position to keep them standing at the same point on that object.
//
// This makes things like moving platforms work.
void
btKinematicCharacterController::maybeApplyFloorLock(btCollisionWorld* collisionWorld, btScalar dt) {
  if (!m_wasOnGround || !m_floorObject) {
    return;
  }

  // check that the floor object is still in the collision world
  btAlignedObjectArray<class btCollisionObject*>& collisionObjectsMut = collisionWorld->getCollisionObjectArray();
  // can't use `findLinearSearch` because of stupid pointer constness issues in the template
  auto collisionObjectCount = collisionObjectsMut.size();
  auto didFindFloorObject = false;
  for (int i = 0; i < collisionObjectCount; ++i) {
    if (collisionObjectsMut[i] == m_floorObject) {
      didFindFloorObject = true;
      break;
    }
  }

  if (!didFindFloorObject) {
    // floor object has been removed from the collision world
    m_floorObject = nullptr;
    m_floorUserIndex = -1;
    return;
  }

  // we can skip this work if the floor object is static
  if (m_floorObject->isStaticObject()) {
    return;
  }

  // if the floor object hasn't moved since the last step, nothing to be done
  auto linearVelocity = m_floorObject->getInterpolationLinearVelocity();
  auto angularVelocity = m_floorObject->getInterpolationAngularVelocity();
  if (linearVelocity.length2() < SIMD_EPSILON && angularVelocity.length2() < SIMD_EPSILON) {
    return;
  }

  // compute the change in position due to the rotation of the floor object
  auto posRelativeToFloorObjectOrigin = m_currentPosition - m_floorObject->getWorldTransform().getOrigin();
  btScalar angle = angularVelocity.length() * dt;
  if (angle > SIMD_EPSILON) {
    btVector3 rotationAxis = angularVelocity.normalized();
    btQuaternion rotationQuat(rotationAxis, angle);
    btVector3 newRelativePos = quatRotate(rotationQuat, posRelativeToFloorObjectOrigin);
    m_currentPosition = m_floorObject->getWorldTransform().getOrigin() + newRelativePos;
  }

  // apply the floor object's motion to the player
  m_currentPosition += linearVelocity * dt;

  // sync the new position to the ghost object
  btTransform& xform = m_ghostObject->getWorldTransform();
  xform.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(xform);
}

void
btKinematicCharacterController::recoverPreExistingPenetration(btCollisionWorld* collisionWorld) {
  int numPenetrationLoops = 0;
  while (recoverFromPenetration(collisionWorld)) {
    numPenetrationLoops++;
    if (numPenetrationLoops > MAX_PENETRATION_LOOPS) {
      printf("Character could not recover from pre-existing penetration after %d loops\n", numPenetrationLoops);
      break;
    }
  }
}

// phase 1: up
void
btKinematicCharacterController::stepUp(btCollisionWorld* world) {
  btScalar stepHeight = 0.0f;
  if (m_verticalVelocity < 0.0) {
    stepHeight = m_stepHeight;
  }

  m_targetPosition = m_currentPosition;
  m_targetPosition += m_up * stepHeight;
  if (m_verticalOffset > 0.) {
    m_targetPosition += m_jumpAxis * m_verticalOffset;
  }

  btTransform start, end;

  start.setIdentity();
  end.setIdentity();

  start.setOrigin(m_currentPosition);
  end.setOrigin(m_targetPosition);

  m_currentPosition = m_targetPosition;

  btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, -m_up, m_maxSlopeCosine);
  callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  m_ghostObject->convexSweepTest(m_convexShape, start, end, callback, world->getDispatchInfo().m_allowedCcdPenetration);

  if (callback.hasHit() && m_ghostObject->hasContactResponse() &&
      needsCollision(m_ghostObject, callback.m_hitCollisionObject)) {
    // Only modify the position if the hit was a slope and not a wall or ceiling.
    if (callback.m_hitNormalWorld.dot(m_up) > 0.0) {
      // we moved up only a fraction of the step height
      m_currentStepOffset = stepHeight * callback.m_closestHitFraction;
      m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
    }

    btTransform& xform = m_ghostObject->getWorldTransform();
    xform.setOrigin(m_currentPosition);
    m_ghostObject->setWorldTransform(xform);

    // fix penetration if we hit a ceiling for example
    int numPenetrationLoops = 0;
    while (recoverFromPenetration(world)) {
      numPenetrationLoops += 1;
      if (numPenetrationLoops > MAX_PENETRATION_LOOPS) {
        printf("character could not recover from penetration in `stepUp` = %d\n", numPenetrationLoops);
        break;
      }
    }
    m_targetPosition = m_ghostObject->getWorldTransform().getOrigin();
    m_currentPosition = m_targetPosition;

    if (m_verticalOffset > 0) {
      m_verticalOffset = 0.0;
      m_verticalVelocity = 0.0;
      m_currentStepOffset = m_stepHeight;
    }
  } else {
    m_currentStepOffset = stepHeight;
    m_currentPosition = m_targetPosition;
  }
}

bool
btKinematicCharacterController::needsCollision(const btCollisionObject* body0, const btCollisionObject* body1) {
  bool collides =
    (body0->getBroadphaseHandle()->m_collisionFilterGroup & body1->getBroadphaseHandle()->m_collisionFilterMask) != 0;
  return collides &&
         (body1->getBroadphaseHandle()->m_collisionFilterGroup & body0->getBroadphaseHandle()->m_collisionFilterMask);
}

void
btKinematicCharacterController::updateTargetPositionBasedOnCollision(
  const btVector3& hitNormal,
  btScalar tangentMag,
  btScalar normalMag
) {
  btVector3 movementDirection = m_targetPosition - m_currentPosition;
  btScalar movementLength = movementDirection.length();
  if (movementLength <= SIMD_EPSILON) {
    return;
  }

  movementDirection.normalize();

  m_targetPosition = m_currentPosition;

  if (normalMag != 0.0) {
    btVector3 reflectDir = computeReflectionDirection(movementDirection, hitNormal).normalize();

    btVector3 perpindicularDir = perpindicularComponent(reflectDir, hitNormal);
    btVector3 perpComponent = perpindicularDir * btScalar(normalMag * movementLength);
    m_targetPosition += perpComponent;
  }
}

// phase 2: forward and strafe
void
btKinematicCharacterController::stepForwardAndStrafe(btCollisionWorld* collisionWorld, btScalar dt) {
  btTransform start, end;
  start.setIdentity();
  end.setIdentity();

  m_targetPosition = m_currentPosition;
  m_targetPosition += m_walkDirection * dt;
  m_targetPosition += m_externalVelocity * dt;

  btScalar fraction = 1.0;
  btScalar distanceSquared = (m_currentPosition - m_targetPosition).length2();

  int maxIters = 10;

  while (fraction > btScalar(0.01) && maxIters-- > 0) {
    start.setOrigin(m_currentPosition);
    end.setOrigin(m_targetPosition);
    btVector3 sweepDirNegative(m_currentPosition - m_targetPosition);

    btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, sweepDirNegative, btScalar(0.0));
    callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
    callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

    btScalar margin = m_convexShape->getMargin();
    m_convexShape->setMargin(margin + m_addedMargin);

    if (!(start == end)) {
      m_ghostObject->convexSweepTest(
        m_convexShape, start, end, callback, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
      );
    }
    m_convexShape->setMargin(margin);

    fraction -= callback.m_closestHitFraction;

    if (callback.hasHit() && m_ghostObject->hasContactResponse() &&
        needsCollision(m_ghostObject, callback.m_hitCollisionObject)) {
      // we moved only a fraction
      updateTargetPositionBasedOnCollision(callback.m_hitNormalWorld);
      btVector3 currentDir = m_targetPosition - m_currentPosition;
      distanceSquared = currentDir.length2();
      if (distanceSquared <= SIMD_EPSILON) {
        break;
      }

      currentDir.normalize();
      // See Quake2: "If velocity is against original velocity, stop ead to avoid tiny oscilations in sloping corners."
      if (currentDir.dot(m_normalizedDirection) <= btScalar(0.0)) {
        break;
      }
    } else {
      m_currentPosition = m_targetPosition;
    }
  }
}

// phase 3: down
void
btKinematicCharacterController::stepDown(btCollisionWorld* collisionWorld, btScalar dt) {
  if (m_verticalVelocity > 0.0) {
    return;
  }

  btTransform start, end, endDouble;
  bool runOnce = false;
  btVector3 origTargetPosition = m_targetPosition;
  btScalar downVelocity = (m_verticalVelocity < 0.f ? -m_verticalVelocity : 0.f) * dt;

  if (downVelocity > 0.0 && downVelocity > m_terminalVelocity && (m_wasOnGround || !m_isJumping)) {
    downVelocity = m_terminalVelocity;
  }

  btVector3 stepDrop = m_up * (m_currentStepOffset + downVelocity);
  m_targetPosition -= stepDrop;

  btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, m_up, m_maxSlopeCosine);
  callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  btKinematicClosestNotMeConvexResultCallback callback2(m_ghostObject, m_up, m_maxSlopeCosine);
  callback2.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback2.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  while (1) {
    start.setIdentity();
    end.setIdentity();

    endDouble.setIdentity();

    start.setOrigin(m_currentPosition);
    end.setOrigin(m_targetPosition);

    // set double test for 2x the step drop, to check for a large drop vs small drop
    endDouble.setOrigin(m_targetPosition - stepDrop);

    m_ghostObject->convexSweepTest(
      m_convexShape, start, end, callback, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
    );

    if (!callback.hasHit() && m_ghostObject->hasContactResponse()) {
      // test a double fall height, to see if the character should interpolate its fall (full) or not (partial)
      m_ghostObject->convexSweepTest(
        m_convexShape, start, endDouble, callback2, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
      );
    }

    btScalar downVelocity2 = (m_verticalVelocity < 0.f ? -m_verticalVelocity : 0.f) * dt;
    bool hasHit = callback2.hasHit() && m_ghostObject->hasContactResponse() &&
                  needsCollision(m_ghostObject, callback2.m_hitCollisionObject);

    if (!hasHit) {
      break;
    }

    btScalar stepHeight = m_verticalVelocity < 0.0 ? m_stepHeight : 0.0;

    if (downVelocity2 > 0.0 && downVelocity2 < stepHeight && !runOnce && (m_wasOnGround || !m_isJumping)) {
      // redo the velocity calculation when falling a small amount, for fast stairs motion
      // for larger falls, use the smoother/slower interpolated movement by not touching the target position

      m_targetPosition = origTargetPosition;
      downVelocity = stepHeight;

      stepDrop = m_up * (m_currentStepOffset + downVelocity);
      m_targetPosition -= stepDrop;
      runOnce = true;
      continue; // re-run previous tests
    }
    break;
  }

  if ((m_ghostObject->hasContactResponse() && callback.hasHit() &&
       needsCollision(m_ghostObject, callback.m_hitCollisionObject)) ||
      runOnce) {
    // we dropped a fraction of the height -> hit floor
    btScalar fraction = (m_currentPosition.getY() - callback.m_hitPointWorld.getY()) / 2.0;

    btScalar oldY = m_currentPosition.getY();
    m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
    btScalar newY = m_currentPosition.getY();

    m_verticalVelocity = 0.0;
    m_verticalOffset = 0.0;
    // Remove downward component of external velocity
    m_externalVelocity -= parallelComponent(m_externalVelocity, m_up);
    m_isJumping = false;

    m_floorObject = callback.m_hitCollisionObject;
    m_floorUserIndex = callback.m_hitCollisionObject->getUserIndex();
  } else {
    m_currentPosition = m_targetPosition;
  }
}

void
btKinematicCharacterController::setWalkDirection(const btVector3& walkDirection) {
  m_walkDirection = walkDirection;
  m_normalizedDirection = getNormalizedVector(m_walkDirection);
}

void
btKinematicCharacterController::warp(const btVector3& origin) {
  btTransform xform;
  xform.setIdentity();
  xform.setOrigin(origin);
  m_ghostObject->setWorldTransform(xform);
}

void
btKinematicCharacterController::preStep(btCollisionWorld* collisionWorld) {
  m_currentPosition = m_ghostObject->getWorldTransform().getOrigin();
  m_targetPosition = m_currentPosition;
}

void
btKinematicCharacterController::playerStep(btCollisionWorld* collisionWorld, btScalar dt) {
  maybeApplyFloorLock(collisionWorld, dt);

  m_wasOnGround = onGround();

  // Update fall velocity.
  m_verticalVelocity -= m_gravity * dt;
  if (m_verticalVelocity == 0.0) {
    // It can sometimes happen that the jump velocities and timesteps match up in such ways that
    // player vertical velocity comes out to exactly 0 at the apogee of the jump. This causes
    // the us to think that the player is on the ground at that point.
    //
    // So we prevent that by adding a tiny amount of downward velocity to the player in that case
    m_verticalVelocity = -0.0001;
  } else if (m_verticalVelocity < 0.0 && btFabs(m_verticalVelocity) > btFabs(m_terminalVelocity)) {
    m_verticalVelocity = -btFabs(m_terminalVelocity);
  }
  m_verticalOffset = m_verticalVelocity * dt;

  // apply damping to external velocity
  btVector3 dampingFactor = m_wasOnGround ? m_externalVelocityGroundDampingFactor : m_externalVelocityAirDampingFactor;
  btVector3 externalVelocityMultiplier = (btVector3(1., 1., 1.) - dampingFactor).pow(dt);
  m_externalVelocity *= externalVelocityMultiplier;

  // if in the air, use directional input to change the direction of external velocity while retaining its magnitude
  //
  // this allows for dashes, boosts, etc. to be controlled rather than just fighting against them with the static
  // velocity normally applied by kinematic movement
  if (!m_wasOnGround && m_normalizedDirection.length2() > 0.0) {
    btVector3 verticalComponent = parallelComponent(m_externalVelocity, m_up);

    btVector3 horizontalComponent = m_externalVelocity - verticalComponent;
    btScalar horizontalMag = horizontalComponent.length();

    if (horizontalMag > SIMD_EPSILON) {
      btVector3 horizontalDir = horizontalComponent / horizontalMag;
      btVector3 newHorizontalDir = m_normalizedDirection;
      newHorizontalDir.normalize();
      horizontalComponent = newHorizontalDir * horizontalMag;
    } else {
      horizontalComponent = m_normalizedDirection * horizontalMag;
    }

    m_externalVelocity = verticalComponent + horizontalComponent;
  }

  // clear external velocity if it's very low-magnitude to avoid sliding around on small inclines etc.
  if (m_externalVelocity.length2() < 0.0003) {
    m_externalVelocity.setValue(0.0, 0.0, 0.0);
  }

#if 0
  recoverPreExistingPenetration(collisionWorld);
#endif

  stepUp(collisionWorld);

  stepForwardAndStrafe(collisionWorld, dt);

  stepDown(collisionWorld, dt);

  btTransform xform = m_ghostObject->getWorldTransform();
  xform.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(xform);

  int numPenetrationLoops = 0;
  while (recoverFromPenetration(collisionWorld)) {
    numPenetrationLoops++;
    if (numPenetrationLoops > MAX_PENETRATION_LOOPS) {
      printf("character could not recover from penetration in `stepDown` = %d\n", numPenetrationLoops);
      break;
    }
  }
}

void
btKinematicCharacterController::setJumpSpeed(btScalar jumpSpeed) {
  m_defaultJumpSpeed = jumpSpeed;
}

void
btKinematicCharacterController::jump(const btVector3& v) {
  m_verticalVelocity = v.length2() == 0 ? m_defaultJumpSpeed : v.length();
  m_isJumping = true;

  m_jumpAxis = v.length2() == 0 ? m_up : v.normalized();
}

void
btKinematicCharacterController::setGravity(const btVector3& gravity) {
  if (gravity.length2() > 0) {
    setUpVector(-gravity);
  }

  m_gravity = gravity.length();
}

void
btKinematicCharacterController::setMaxSlope(btScalar slopeRadians) {
  m_maxSlopeRadians = slopeRadians;
  m_maxSlopeCosine = btCos(slopeRadians);
}

void
btKinematicCharacterController::setMaxPenetrationDepth(btScalar d) {
  m_maxPenetrationDepth = d;
}

void
btKinematicCharacterController::setStepHeight(btScalar h) {
  m_stepHeight = h;
}

void
btKinematicCharacterController::setUp(const btVector3& up) {
  if (up.length2() > 0 && m_gravity > 0.0f) {
    setGravity(-m_gravity * up.normalized());
    return;
  }

  setUpVector(up);
}

void
btKinematicCharacterController::setUpVector(const btVector3& up) {
  if (m_up == up) {
    return;
  }

  btVector3 oldUp = m_up;

  if (up.length2() > 0) {
    m_up = up.normalized();
  } else {
    m_up = btVector3(0.0, 0.0, 0.0);
  }

  if (!m_ghostObject) {
    return;
  }
  btQuaternion rot = getRotation(m_up, oldUp);

  // set orientation with new up
  btTransform xform = m_ghostObject->getWorldTransform();
  btQuaternion orn = rot.inverse() * xform.getRotation();
  xform.setRotation(orn);
  m_ghostObject->setWorldTransform(xform);
}

btQuaternion
btKinematicCharacterController::getRotation(btVector3& v0, btVector3& v1) const {
  if (v0.length2() == 0.0f || v1.length2() == 0.0f) {
    btQuaternion q;
    return q;
  }

  return shortestArcQuatNormalize2(v0, v1);
}
